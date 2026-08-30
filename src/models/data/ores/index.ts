import type { Ore } from "./types";
import { bronzeVein } from "./bronze-vein";
import { silverVein } from "./silver-vein";
import { goldVein } from "./gold-vein";
import { diamondVein } from "./diamond-vein";
import { lunarVein } from "./lunar-vein";

export type { Ore } from "./types";

export const ORES: readonly Ore[] = [bronzeVein, silverVein, goldVein, diamondVein, lunarVein];

export const MINING_MAX_LEVEL = ORES[ORES.length - 1].requiredLevel;

export function findOre(oreId: string): Ore | undefined {
  return ORES.find((ore) => ore.id === oreId);
}
