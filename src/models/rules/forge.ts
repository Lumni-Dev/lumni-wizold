import {
  ENHANCEMENT_STEP,
  FORGE_BASE_MS,
  FORGE_BRONZE_RATIO,
  FORGE_MS_PER_LEVEL,
} from "@/shared/constants/game";
import { huntPurse } from "../data/species";
import type { Item, ItemEffect } from "../entities/item";

export function enhancementCost(nextLevel: number): number {
  return Math.max(1, Math.ceil(nextLevel / 3));
}

export function forgeBronzeCost(characterLevel: number, level: number): number {
  return (
    Math.max(1, Math.round(huntPurse(characterLevel) * FORGE_BRONZE_RATIO)) + Math.max(0, level)
  );
}

export function enhancedEffect(item: Item, level: number): ItemEffect {
  if (level <= 0) return item.effect;

  const forged = (value: number) => Math.round(value * (1 + ENHANCEMENT_STEP * level));

  const attributes = item.effect.attributes
    ? Object.fromEntries(
        Object.entries(item.effect.attributes).map(([key, value]) => [key, forged(value)]),
      )
    : undefined;

  return { ...item.effect, attributes: attributes as ItemEffect["attributes"] };
}

export function forgeDurationMs(level: number): number {
  return FORGE_BASE_MS + Math.max(0, level) * FORGE_MS_PER_LEVEL;
}

export function enhancementOf(
  enhancements: Record<string, number> | undefined,
  itemId: string,
): number {
  return enhancements?.[itemId] ?? 0;
}

export function enhancedName(name: string, level: number): string {
  return level > 0 ? name + " +" + level : name;
}
