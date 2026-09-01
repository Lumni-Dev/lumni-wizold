import { huntPurse } from "./economy";
import type { StorePack } from "../data/store-packs";

export function packBronze(pack: StorePack, level: number): number {
  return Math.round(huntPurse(level) * pack.hunts);
}

export function bronzePerReal(pack: StorePack, level: number): number {
  return Math.round(packBronze(pack, level) / (pack.priceCents / 100));
}
