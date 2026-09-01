import type { PoolClient } from "pg";
import * as tavernController from "@/controllers/tavern.controller";
import type { TavernIdentity } from "@/models/entities/tavern";
import { loadTavern, pruneStale } from "@/models/repositories/server/tavern.store";
import type { RoomSummary } from "@/controllers/tavern.controller";

export interface TavernBoardPayload {
  identity: TavernIdentity;
  rooms: RoomSummary[];
  revision: number;
}

async function tavernIdentity(client: PoolClient, userId: string): Promise<TavernIdentity | null> {
  const found = await client.query("select id, name, level from characters where user_id = $1", [
    userId,
  ]);
  const row = found.rows[0];
  return row ? { id: row.id, name: row.name, level: Number(row.level) } : null;
}

export async function readTavernRevision(client: PoolClient): Promise<number> {
  const found = await client.query("select revision from tavern_signal where id = 1");
  return Number(found.rows[0]?.revision ?? 0);
}

export async function bumpTavernRevision(client: PoolClient): Promise<number> {
  const found = await client.query(
    "update tavern_signal set revision = revision + 1 where id = 1 returning revision",
  );
  return Number(found.rows[0]?.revision ?? 0);
}

export async function buildTavernBoard(
  client: PoolClient,
  userId: string,
): Promise<TavernBoardPayload | null> {
  await pruneStale(client);
  const identity = await tavernIdentity(client, userId);
  if (!identity) return null;
  const tavern = await loadTavern(client);
  const revision = await readTavernRevision(client);
  return {
    identity,
    rooms: tavernController.listRooms(tavern.state, identity),
    revision,
  };
}
