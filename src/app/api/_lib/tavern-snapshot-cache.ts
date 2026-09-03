import type { PoolClient } from "pg";
import { MAX_ROOM_MESSAGES } from "@/models/entities/tavern";
import type { LoadedTavern } from "@/models/repositories/server/tavern.store";
import {
  buildTavernFromParts,
  loadTavernMembers,
  loadTavernStructure,
} from "@/models/repositories/server/tavern.store";
import { readTavernRevision } from "./tavern-board";

let structureCache: {
  revision: number;
  structure: Awaited<ReturnType<typeof loadTavernStructure>>;
} | null = null;

export function invalidateTavernStructureCache(): void {
  structureCache = null;
}

export async function loadTavernCached(client: PoolClient): Promise<LoadedTavern> {
  const revision = await readTavernRevision(client);
  let structure = structureCache?.revision === revision ? structureCache.structure : null;
  if (!structure) {
    structure = await loadTavernStructure(client, MAX_ROOM_MESSAGES);
    structureCache = { revision, structure };
  }
  const members = await loadTavernMembers(client);
  return buildTavernFromParts(structure, members);
}
