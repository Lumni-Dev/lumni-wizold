import type { EquipmentSet } from "./item";

export interface Ore {
  id: string;
  label: string;
  fragmentId: string;
  set: EquipmentSet;
  requiredLevel: number;
  minYield: number;
  maxYield: number;
}

export interface MiningState {
  level: number;
  progress: number;
  windowStart?: string;
  count: number;
}

export function initialMining(): MiningState {
  return { level: 1, progress: 0, count: 0 };
}
