import { setForLevel, setTotalPrice } from "../data/equipment/index";
import type { StorePack } from "../data/store-packs";
import { huntPurse } from "./economy";

export function packBronze(pack: StorePack, level: number): number {
  return Math.round(setTotalPrice(setForLevel(level)) * pack.setShare);
}

export function packHuntEquivalent(pack: StorePack, level: number): number {
  const purse = huntPurse(level);
  if (purse <= 0) return 1;
  return Math.max(1, Math.round(packBronze(pack, level) / purse));
}

export function bronzePerReal(pack: StorePack, level: number): number {
  return Math.round(packBronze(pack, level) / (pack.priceCents / 100));
}
