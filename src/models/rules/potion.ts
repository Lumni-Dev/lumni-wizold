import type { Item } from "../entities/item";
import { intBetween, type Random } from "@/shared/utils/random";

export function rollHealthPotionHeal(item: Item, random: Random): number {
  const min = item.effect.healthMin;
  const max = item.effect.healthMax;
  if (min === undefined && max === undefined) return 0;
  return intBetween(min ?? max ?? 0, max ?? min ?? 0, random);
}
