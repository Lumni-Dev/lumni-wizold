import type { PoolClient } from "pg";
import * as tavernController from "@/controllers/tavern.controller";
import type { TavernIdentity } from "@/models/entities/tavern";
import { isVip } from "@/models/rules/vip";
import { loadTavernUser } from "@/models/repositories/server/tavern-user.store";
import { maybePruneStale } from "@/models/repositories/server/tavern.store";
import type { TavernUserState } from "@/models/entities/tavern";
import type { RoomSummary } from "@/controllers/tavern.controller";
import { loadTavernCached } from "./tavern-snapshot-cache";
import { publishTavernRevision } from "./tavern-bus";

export interface TavernBoardPayload {
  identity: TavernIdentity;
  rooms: RoomSummary[];
  revision: number;
  user: TavernUserState;
}

async function tavernIdentity(client: PoolClient, userId: string): Promise<TavernIdentity | null> {
  const found = await client.query(
    "select id, name, level, vip_until from characters where user_id = $1",
    [userId],
  );
  const row = found.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    level: Number(row.level),
    vip: isVip(
      { vipUntil: row.vip_until ? new Date(row.vip_until).toISOString() : undefined },
      Date.now(),
    ),
  };
}

export async function readTavernRevision(client: PoolClient): Promise<number> {
  const found = await client.query("select revision from tavern_signal where id = 1");
  return Number(found.rows[0]?.revision ?? 0);
}

export async function bumpTavernRevision(client: PoolClient): Promise<number> {
  const found = await client.query(
    "update tavern_signal set revision = revision + 1 where id = 1 returning revision",
  );
  const { invalidateTavernStructureCache } = await import("./tavern-snapshot-cache");
  invalidateTavernStructureCache();
  return Number(found.rows[0]?.revision ?? 0);
}

export async function buildTavernBoard(
  client: PoolClient,
  userId: string,
): Promise<TavernBoardPayload | null> {
  if (await maybePruneStale(client)) {
    const pruned = await bumpTavernRevision(client);
    publishTavernRevision(pruned);
  }
  const identity = await tavernIdentity(client, userId);
  if (!identity) return null;
  const [tavern, revision, user] = await Promise.all([
    loadTavernCached(client),
    readTavernRevision(client),
    loadTavernUser(client, identity.id),
  ]);
  return {
    identity,
    rooms: tavernController.listRooms(tavern.state, identity),
    revision,
    user,
  };
}
