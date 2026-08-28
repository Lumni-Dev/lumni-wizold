import type { PoolClient } from "pg";
import {
  MEMBER_TIMEOUT_MS,
  type TavernRoom,
  type TavernState,
  TAVERN_VERSION,
} from "../../entities/tavern";

// The tavern controllers are pure over a whole TavernState, so the server
// loads the whole tavern, runs the same code the browser ran, and persists
// only the rooms the call touched. A single advisory lock serializes tavern
// writers: the tavern is one small table of tables, and correctness beats
// concurrency here.
//
// Passwords never enter the controller state: the hash stays in its column,
// and a room loads with password "" (locked, already verified upstream) or
// null (open). The endpoint checks the hash before the controller runs.

const TAVERN_LOCK = 0x77697a01;

export async function lockTavern(client: PoolClient): Promise<void> {
  await client.query("select pg_advisory_xact_lock($1)", [TAVERN_LOCK]);
}

export async function pruneStale(client: PoolClient): Promise<void> {
  await client.query(
    `delete from tavern_members using tavern_rooms
     where tavern_members.room_id = tavern_rooms.id
       and tavern_rooms.private_for is null
       and tavern_members.last_seen < now() - make_interval(secs => $1)`,
    [MEMBER_TIMEOUT_MS / 1000],
  );
  await client.query(
    `delete from tavern_rooms
     where private_for is null
       and not exists (select 1 from tavern_members where room_id = tavern_rooms.id)`,
  );
}

export interface LoadedTavern {
  state: TavernState;
  hashes: Map<string, string>;
}

export async function loadTavern(client: PoolClient): Promise<LoadedTavern> {
  const [rooms, members, messages] = await Promise.all([
    client.query("select * from tavern_rooms order by created_at"),
    client.query("select * from tavern_members order by joined_at"),
    client.query("select * from tavern_messages order by sent_at"),
  ]);

  const hashes = new Map<string, string>();
  const byRoom = <T extends { room_id: string }>(roomId: string, rows: T[]): T[] =>
    rows.filter((row) => row.room_id === roomId);

  const state: TavernState = {
    version: TAVERN_VERSION,
    rooms: rooms.rows.map((row): TavernRoom => {
      if (row.password_hash) hashes.set(row.id, row.password_hash);
      return {
        id: row.id,
        name: row.name,
        password: row.password_hash ? "" : null,
        ownerId: row.owner_id,
        createdAt: new Date(row.created_at).toISOString(),
        privateFor: row.private_for ?? undefined,
        members: byRoom(row.id, members.rows).map((member) => ({
          id: member.member_id,
          name: member.member_name,
          joinedAt: new Date(member.joined_at).toISOString(),
          lastSeen: new Date(member.last_seen).toISOString(),
        })),
        messages: byRoom(row.id, messages.rows).map((message) => ({
          id: message.id,
          authorId: message.author_id,
          authorName: message.author_name,
          text: message.body,
          at: new Date(message.sent_at).toISOString(),
        })),
      };
    }),
  };

  return { state, hashes };
}

async function saveRoom(
  client: PoolClient,
  room: TavernRoom,
  passwordHash: string | null,
): Promise<void> {
  await client.query(
    `insert into tavern_rooms (id, name, password_hash, owner_id, private_for, created_at)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (id) do update set name = $2`,
    [room.id, room.name, passwordHash, room.ownerId, room.privateFor ?? null, room.createdAt],
  );

  await client.query("delete from tavern_members where room_id = $1", [room.id]);
  for (const member of room.members) {
    await client.query(
      `insert into tavern_members (room_id, member_id, member_name, joined_at, last_seen)
       values ($1, $2, $3, $4, $5)`,
      [room.id, member.id, member.name, member.joinedAt, member.lastSeen],
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

/**
 * Persists the difference between two tavern states: rooms that vanished are
 * deleted, rooms whose reference changed are rewritten. Untouched rooms keep
 * their reference through the pure controllers, so this stays cheap.
 */
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
