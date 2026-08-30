import type { EquipmentSet } from "./item";

export interface Ore {
  id: string;
  label: string;
  fragmentId: string;
  set: EquipmentSet;
  requiredLevel: number;
  minYield: number;
  maxYield: number;
  progress: number;
}

export interface MiningState {
  level: number;
  progress: number;
  // The daily quota: when the current window opened (ISO, unset before the
  // first mining) and how many minings it has already landed.
  windowStart?: string;
  count: number;
}

export function initialMining(): MiningState {
  return { level: 1, progress: 0, count: 0 };
}

// ORES, MINING_MAX_LEVEL and findOre now live in data/ores/ (one file per vein),
// because catalog data belongs in the data layer, not in entities. This file keeps
// only the Ore shape and the MiningState the run persists.
