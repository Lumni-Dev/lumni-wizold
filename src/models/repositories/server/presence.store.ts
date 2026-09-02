import type { PoolClient } from "pg";
import { resolveDoing, type HunterDoing } from "@/models/entities/activity";
import type { MatePresence, PresenceStatus } from "@/models/entities/presence";
import { resolvePresence } from "@/models/rules/presence";

export async function touchPresence(
  client: PoolClient,
  characterId: string,
  status: "active" | "away",
): Promise<void> {
  await client.query(
    "update characters set presence_status = $1, presence_at = now() where id = $2",
    [status, characterId],
  );
}

export async function clearPresence(client: PoolClient, characterId: string): Promise<void> {
  await client.query(
    "update characters set presence_status = 'offline', presence_at = now() where id = $1",
    [characterId],
  );
  await client.query("delete from activities where character_id = $1", [characterId]);
}

export async function clearPresenceForUser(client: PoolClient, userId: string): Promise<void> {
  await client.query(
    "update characters set presence_status = 'offline', presence_at = now() where user_id = $1",
    [userId],
  );
  await client.query(
    "delete from activities where character_id in (select id from characters where user_id = $1)",
    [userId],
  );
}

export async function listPackPresence(
  client: PoolClient,
  characterId: string,
  now = Date.now(),
): Promise<MatePresence[]> {
  const found = await client.query<{
    id: string;
    presence_status: PresenceStatus;
    presence_at: string | null;
  }>(
    `select c.id, c.presence_status, c.presence_at
     from pack_mates pm
     join characters c on c.id = pm.mate_id
     where pm.character_id = $1`,
    [characterId],
  );
  return found.rows.map((row) => ({
    id: row.id,
    status: resolvePresence(row.presence_status, row.presence_at, now),
  }));
}

export async function listVisibleDoing(
  client: PoolClient,
  viewerId: string,
  now = Date.now(),
): Promise<{ id: string; doing: HunterDoing }[]> {
  const visible = await client.query<{ id: string }>(
    `select $1::text as id
     union
     select mate_id from pack_mates where character_id = $1
     union
     select tm.member_id
       from tavern_members tm
       join tavern_rooms tr on tr.id = tm.room_id
      where tr.private_for is null
         or $1 = any(tr.private_for)
         or exists (
           select 1 from tavern_members seat
            where seat.room_id = tr.id and seat.member_id = $1
         )
     union
     select msg.author_id
       from tavern_messages msg
       join tavern_members seat on seat.room_id = msg.room_id
      where seat.member_id = $1
        and msg.author_id <> 'system'`,
    [viewerId],
  );
  const ids = visible.rows.map((row) => row.id);
  if (ids.length === 0) return [];
  const found = await client.query<{ character_id: string; kind: string; started_at: Date }>(
    "select character_id, kind, started_at from activities where character_id = any($1::text[])",
    [ids],
  );
  const byId = new Map(found.rows.map((row) => [row.character_id, row]));
  return ids.map((id) => {
    const row = byId.get(id);
    return {
      id,
      doing: resolveDoing(
        row?.kind ?? null,
        row?.started_at ? new Date(row.started_at).toISOString() : null,
        now,
      ),
    };
  });
}
