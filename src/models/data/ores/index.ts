import type { Ore } from "./types";
import { bronzeVein } from "./bronze-vein";
import { silverVein } from "./silver-vein";
import { goldVein } from "./gold-vein";
import { diamondVein } from "./diamond-vein";
import { lunarVein } from "./lunar-vein";

export type { Ore } from "./types";

// Five veins, one per file, in the order the sets unlock. requiredLevel is the
// CHARACTER level that opens the vein, the same one the set of that material asks
// (bronze 1, metal 201, gold 401, diamond 601, lunar 801), so a fragment is mined
// exactly when the gear it forges can be worn. MINING_MAX_LEVEL stays the deepest
// of those, derived, never hand-written; the mining level itself only lifts yield.
export const ORES: readonly Ore[] = [bronzeVein, silverVein, goldVein, diamondVein, lunarVein];

export const MINING_MAX_LEVEL = ORES[ORES.length - 1].requiredLevel;

export function findOre(oreId: string): Ore | undefined {
  return ORES.find((ore) => ore.id === oreId);
}
