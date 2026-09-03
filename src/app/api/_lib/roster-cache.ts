import type { PoolClient } from "pg";
import type { Hunter } from "@/models/entities/ranking";
import {
  bumpRosterRevision as bumpRosterRevisionDb,
  loadHunters,
  readRosterRevision,
} from "@/models/repositories/server/roster.store";

export { readRosterRevision };

let cached: { revision: number; hunters: Hunter[]; at: number } | null = null;

export function invalidateRosterCache(): void {
  cached = null;
}

export async function bumpRosterRevision(client: PoolClient): Promise<void> {
  await bumpRosterRevisionDb(client);
  invalidateRosterCache();
}

export async function cachedHunters(client: PoolClient): Promise<Hunter[]> {
  const revision = await readRosterRevision(client);
  if (cached && cached.revision === revision && Date.now() - cached.at < 60_000) {
    return cached.hunters;
  }
  const hunters = await loadHunters(client);
  cached = { revision, hunters, at: Date.now() };
  return hunters;
}
