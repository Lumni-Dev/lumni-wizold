import type { PoolClient } from "pg";
import {
  MEMBER_TIMEOUT_MS,
  MAX_ROOM_MESSAGES,
  type TavernMember,
  type TavernRoom,
  type TavernState,
  TAVERN_VERSION,
} from "../../entities/tavern";
import { nickColorCapacity, paintMembers } from "../../rules/tavern-nicks";

type RoomRow = {
  id: string;
  name: string;
  number?: unknown;
  name_hidden?: unknown;
  password_hash: string | null;
  owner_id: string;
  created_at: Date;
  private_for?: string[] | null;
};

type MemberRow = {
  room_id: string;
  member_id: string;
  member_name: string;
  joined_at: Date;
  last_seen: Date;
  nick_color?: number;
};

type MessageRow = {
  id: string;
  room_id: string;
  author_id: string;
  author_name: string;
  body: string;
  sent_at: Date;
};

export interface TavernStructure {
  roomRows: RoomRow[];
  messageRows: MessageRow[];
  hashes: Map<string, string>;
}

function roomNumberOf(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) && number >= 1 ? number : 0;
}

function roomFromRow(
  row: {
    id: string;
    name: string;
    number?: unknown;
    name_hidden?: unknown;
    password_hash: string | null;
    owner_id: string;
    created_at: Date;
    private_for?: string[] | null;
  },
  members: TavernMember[],
  messages: TavernRoom["messages"],
): TavernRoom {
  return {
    id: row.id,
    name: row.name,
    number: roomNumberOf(row.number),
    nameHidden: row.name_hidden === true,
    password: row.password_hash ? "" : null,
    ownerId: row.owner_id,
    createdAt: new Date(row.created_at).toISOString(),
    privateFor: row.private_for ?? undefined,
    members,
    messages,
  };
}

function assignMissingNumbers(rooms: TavernRoom[]): TavernRoom[] {
  const taken = new Set(rooms.map((room) => room.number).filter((value) => value >= 1));
  let next = 1;
  return rooms.map((room) => {
    if (room.number >= 1) return room;
    while (taken.has(next)) next += 1;
    taken.add(next);
    return { ...room, number: next };
  });
}

function membersOf(rows: MemberRow[], privateFor?: string[]): TavernMember[] {
  return paintMembers(
    rows.map((member) => ({
      id: member.member_id,
      name: member.member_name,
      joinedAt: new Date(member.joined_at).toISOString(),
      lastSeen: new Date(member.last_seen).toISOString(),
      nickColor: member.nick_color,
    })),
    nickColorCapacity({ privateFor }),
  );
}

function byRoom<T extends { room_id: string }>(roomId: string, rows: T[]): T[] {
  return rows.filter((row) => row.room_id === roomId);
}

export function buildTavernFromParts(
  structure: TavernStructure,
  memberRows: MemberRow[],
): LoadedTavern {
  const state: TavernState = {
    version: TAVERN_VERSION,
    rooms: assignMissingNumbers(
      structure.roomRows.map((row): TavernRoom => {
        return roomFromRow(
          row,
          membersOf(byRoom(row.id, memberRows), row.private_for ?? undefined),
          byRoom(row.id, structure.messageRows).map((message) => ({
            id: message.id,
            authorId: message.author_id,
            authorName: message.author_name,
            text: message.body,
            at: new Date(message.sent_at).toISOString(),
          })),
        );
      }),
    ),
  };
  return { state, hashes: structure.hashes };
}

export async function loadTavernStructure(
  client: PoolClient,
  messageLimit: number,
): Promise<TavernStructure> {
  const rooms = await client.query<RoomRow>("select * from tavern_rooms order by created_at");
  const messages = await client.query<MessageRow>(
    `with ranked as (
       select id, room_id, author_id, author_name, body, sent_at,
              row_number() over (partition by room_id order by sent_at desc) as rn
       from tavern_messages
     )
     select id, room_id, author_id, author_name, body, sent_at
     from ranked where rn <= $1 order by room_id, sent_at`,
    [messageLimit],
  );
  const hashes = new Map<string, string>();
  for (const row of rooms.rows) {
    if (row.password_hash) hashes.set(row.id, row.password_hash);
  }
  return { roomRows: rooms.rows, messageRows: messages.rows, hashes };
}

export async function loadTavernMembers(client: PoolClient): Promise<MemberRow[]> {
  const members = await client.query<MemberRow>(
    "select room_id, member_id, member_name, joined_at, last_seen, nick_color from tavern_members order by joined_at",
  );
  return members.rows;
}
const TAVERN_LOCK = 0x77697a01;
let lastPruneAt = 0;
const PRUNE_INTERVAL_MS = 30_000;

export async function maybePruneStale(client: PoolClient): Promise<boolean> {
  const now = Date.now();
  if (now - lastPruneAt < PRUNE_INTERVAL_MS) return false;
  lastPruneAt = now;
  return pruneStale(client);
}

export async function lockTavern(client: PoolClient): Promise<void> {
  await client.query("select pg_advisory_xact_lock($1)", [TAVERN_LOCK]);
}
export async function pruneStale(client: PoolClient): Promise<boolean> {
  const members = await client.query(
    `delete from tavern_members using tavern_rooms
     where tavern_members.room_id = tavern_rooms.id
       and tavern_rooms.private_for is null
       and tavern_members.last_seen < now() - make_interval(secs => $1)`,
    [MEMBER_TIMEOUT_MS / 1000],
  );
  const rooms = await client.query(`delete from tavern_rooms
     where private_for is null
       and not exists (select 1 from tavern_members where room_id = tavern_rooms.id)`);
  const extras = await client.query(
    `delete from tavern_messages
     where id in (
       select id from (
         select id, row_number() over (partition by room_id order by sent_at desc, id desc) as rn
         from tavern_messages
       ) ranked
       where rn > $1
     )`,
    [MAX_ROOM_MESSAGES],
  );
  return (members.rowCount ?? 0) + (rooms.rowCount ?? 0) + (extras.rowCount ?? 0) > 0;
}
export interface LoadedTavern {
  state: TavernState;
  hashes: Map<string, string>;
}
export async function loadRoomState(
  client: PoolClient,
  roomId: string,
  lock: boolean,
): Promise<LoadedTavern> {
  const rooms = await client.query(
    "select * from tavern_rooms where id = $1" + (lock ? " for update" : ""),
    [roomId],
  );
  const hashes = new Map<string, string>();
  const row = rooms.rows[0];
  if (!row) return { state: { version: TAVERN_VERSION, rooms: [] }, hashes };
  const members = await client.query(
    "select * from tavern_members where room_id = $1 order by joined_at",
    [roomId],
  );
  const messages = await client.query<MessageRow>(
    `select id, room_id, author_id, author_name, body, sent_at
     from (
       select id, room_id, author_id, author_name, body, sent_at,
              row_number() over (order by sent_at desc) as rn
       from tavern_messages
       where room_id = $1
     ) recent where rn <= $2 order by sent_at`,
    [roomId, MAX_ROOM_MESSAGES],
  );
  if (row.password_hash) hashes.set(row.id, row.password_hash);
  const state: TavernState = {
    version: TAVERN_VERSION,
    rooms: assignMissingNumbers([
      roomFromRow(
        row,
        membersOf(members.rows, row.private_for ?? undefined),
        messages.rows.map((message) => ({
          id: message.id,
          authorId: message.author_id,
          authorName: message.author_name,
          text: message.body,
          at: new Date(message.sent_at).toISOString(),
        })),
      ),
    ]),
  };
  return { state, hashes };
}
export async function loadTavern(client: PoolClient): Promise<LoadedTavern> {
  const [structure, members] = await Promise.all([
    loadTavernStructure(client, MAX_ROOM_MESSAGES),
    loadTavernMembers(client),
  ]);
  return buildTavernFromParts(structure, members);
}
async function saveRoom(
  client: PoolClient,
  room: TavernRoom,
  passwordHash: string | null,
): Promise<void> {
  await client.query(
    `insert into tavern_rooms (id, name, password_hash, owner_id, private_for, created_at, number, name_hidden)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (id) do update set name = $2, number = $7, name_hidden = $8`,
    [
      room.id,
      room.name,
      passwordHash,
      room.ownerId,
      room.privateFor ?? null,
      room.createdAt,
      room.number,
      room.nameHidden,
    ],
  );
  await client.query("delete from tavern_members where room_id = $1", [room.id]);
  for (const member of room.members) {
    await client.query(
      `insert into tavern_members (room_id, member_id, member_name, joined_at, last_seen, nick_color)
       values ($1, $2, $3, $4, $5, $6)`,
      [room.id, member.id, member.name, member.joinedAt, member.lastSeen, member.nickColor],
    );
  }
  await client.query("delete from tavern_messages where room_id = $1", [room.id]);
  for (const message of room.messages) {
    await client.query(
      `insert into tavern_messages (id, room_id, author_id, author_name, body, sent_at)
       values ($1, $2, $3, $4, $5, $6)`,
      [message.id, room.id, message.authorId, message.authorName, message.text, message.at],
    );
  }
}
export async function saveTavernDiff(
  client: PoolClient,
  before: TavernState,
  after: TavernState,
  hashes: Map<string, string>,
  newHashes?: Map<string, string>,
): Promise<void> {
  const kept = new Set(after.rooms.map((room) => room.id));
  for (const room of before.rooms) {
    if (!kept.has(room.id)) {
      await client.query("delete from tavern_rooms where id = $1", [room.id]);
    }
  }
  const previous = new Map(before.rooms.map((room) => [room.id, room]));
  for (const room of after.rooms) {
    if (previous.get(room.id) === room) continue;
    const hash = newHashes?.get(room.id) ?? hashes.get(room.id) ?? null;
    await saveRoom(client, room, hash);
  }
}
export async function heartbeat(
  client: PoolClient,
  roomId: string,
  memberId: string,
  memberName: string,
): Promise<void> {
  await client.query(
    `update tavern_members set last_seen = now(), member_name = $3
     where room_id = $1 and member_id = $2`,
    [roomId, memberId, memberName],
  );
}

export async function censorTavernMessage(
  client: PoolClient,
  roomId: string,
  messageId: string,
  body: string,
): Promise<boolean> {
  const updated = await client.query(
    `update tavern_messages set body = $1
     where id = $2 and room_id = $3 and author_id <> 'system'`,
    [body, messageId, roomId],
  );
  return (updated.rowCount ?? 0) > 0;
}
