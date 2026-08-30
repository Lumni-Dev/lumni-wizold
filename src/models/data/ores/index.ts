import type { Ore } from "./types";
import { bronzeVein } from "./bronze-vein";
import { silverVein } from "./silver-vein";
import { goldVein } from "./gold-vein";
import { diamondVein } from "./diamond-vein";
import { lunarVein } from "./lunar-vein";

export type { Ore } from "./types";

// Five veins, one per file, in the order mining unlocks them. requiredLevel is the
// mining ladder (its own climb), not the character's level; the ceiling is the
// deepest vein's requirement, so MINING_MAX_LEVEL is derived, never hand-written.
export const ORES: readonly Ore[] = [bronzeVein, silverVein, goldVein, diamondVein, lunarVein];

export const MINING_MAX_LEVEL = ORES[ORES.length - 1].requiredLevel;

export function findOre(oreId: string): Ore | undefined {
  return ORES.find((ore) => ore.id === oreId);
}
