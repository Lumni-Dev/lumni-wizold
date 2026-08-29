import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { ARENA_HISTORY_SIZE, type ArenaHistoryEntry, type ArenaOutcome } from "@/models/entities/arena";

export async function recordArenaDuel(
  client: PoolClient,
  duel: {
    challengerId: string;
    challengerName: string;
    rivalId: string;
    rivalName: string;
    outcome: ArenaOutcome;
    spoils: number;
  },
): Promise<void> {
  await client.query(
    `insert into arena_history (id, challenger_id, challenger_name, rival_id, rival_name, outcome, spoils)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [
      "duel_" + randomUUID().replaceAll("-", ""),
      duel.challengerId,
      duel.challengerName,
      duel.rivalId,
      duel.rivalName,
      duel.outcome,
      Math.max(0, Math.round(duel.spoils)),
    ],
  );
}

export async function listArenaHistory(
  client: PoolClient,
  characterId: string,
): Promise<ArenaHistoryEntry[]> {
  const found = await client.query(
    `select id, challenger_id, challenger_name, rival_id, rival_name, outcome, spoils, created_at
     from arena_history
     where challenger_id = $1 or rival_id = $1
     order by created_at desc
     limit $2`,
    [characterId, ARENA_HISTORY_SIZE],
  );

  return found.rows.map((row) => ({
    id: row.id,
    challengerId: row.challenger_id,
    challengerName: row.challenger_name,
    rivalId: row.rival_id,
    rivalName: row.rival_name,
    outcome: row.outcome as ArenaOutcome,
    spoils: Number(row.spoils),
    at: new Date(row.created_at).toISOString(),
  }));
}
