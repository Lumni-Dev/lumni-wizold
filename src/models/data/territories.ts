import type { Territory } from "../entities/territory";
import { buildTerritories } from "./species";

export const TERRITORIES: readonly Territory[] = buildTerritories();

const TERRITORY_INDEX = new Map<string, Territory>(
  TERRITORIES.map((territory) => [territory.id, territory]),
);

export function findTerritory(territoryId: string): Territory | undefined {
  return TERRITORY_INDEX.get(territoryId);
}
