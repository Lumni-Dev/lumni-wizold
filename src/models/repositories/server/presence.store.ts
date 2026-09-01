import type { PoolClient } from "pg";
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
}

export async function clearPresenceForUser(client: PoolClient, userId: string): Promise<void> {
  await client.query(
    "update characters set presence_status = 'offline', presence_at = now() where user_id = $1",
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
