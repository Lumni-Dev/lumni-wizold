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
}

export function initialMining(): MiningState {
  return { level: 1, progress: 0 };
}

export const ORES: readonly Ore[] = [
  {
    id: "bronze-vein",
    label: "Fragmento de Bronze",
    fragmentId: "bronze-fragment",
    set: "bronze",
    requiredLevel: 1,
    minYield: 1,
    maxYield: 3,
    progress: 10,
  },
  {
    id: "silver-vein",
    label: "Fragmento de Metal",
    fragmentId: "silver-fragment",
    set: "silver",
    requiredLevel: 10,
    minYield: 1,
    maxYield: 3,
    progress: 45,
  },
  {
    id: "gold-vein",
    label: "Fragmento de Ouro",
    fragmentId: "gold-fragment",
    set: "gold",
    requiredLevel: 25,
    minYield: 1,
    maxYield: 2,
    progress: 120,
  },
  {
    id: "diamond-vein",
    label: "Fragmento de Diamante",
    fragmentId: "diamond-fragment",
    set: "diamond",
    requiredLevel: 45,
    minYield: 1,
    maxYield: 2,
    progress: 260,
  },
  {
    id: "lunar-vein",
    label: "Fragmento Lunar",
    fragmentId: "lunar-fragment",
    set: "lunar",
    requiredLevel: 70,
    minYield: 1,
    maxYield: 2,
    progress: 520,
  },
];

export const MINING_MAX_LEVEL = ORES[ORES.length - 1].requiredLevel;

export function findOre(oreId: string): Ore | undefined {
  return ORES.find((ore) => ore.id === oreId);
}
