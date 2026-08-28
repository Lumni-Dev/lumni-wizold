import type { EquipmentSet, Item } from "../entities/item";

export const BAZAAR_FEE_RATIO = 0.1;

export const MIN_LISTING_CENTS = 100;

export const MIN_WITHDRAW_CENTS = 10_000;

export const MAX_LISTING_CENTS = 1_000_000;

export function feeOf(cents: number): number {
  return Math.round(cents * BAZAAR_FEE_RATIO);
}

export function sellerNet(cents: number): number {
  return cents - feeOf(cents);
}

export function isForgeMaterial(item: Item): boolean {
  return item.category === "material" && item.id.endsWith("-fragment");
}

export interface TradeCheck {
  tradable: boolean;
  reason: string | null;
}

export function checkTrade(item: Item, enhancement: number): TradeCheck {
  if (isForgeMaterial(item)) return { tradable: true, reason: null };
  if (enhancement > 0) return { tradable: true, reason: null };
  if (item.inMarket) {
    return { tradable: false, reason: "O mercado vende igual: só peça forjada entra no bazar." };
  }

  return { tradable: false, reason: "Sem forja: leve à bigorna antes de anunciar." };
}

const SET_TIER: Record<EquipmentSet, number> = {
  bronze: 0,
  silver: 1,
  gold: 2,
  diamond: 3,
  lunar: 4,
};

const FRAGMENT_CENTS: readonly number[] = [100, 150, 400, 900, 2000];

export function suggestedPriceCents(item: Item, enhancement: number): number {
  if (isForgeMaterial(item)) {
    const set = item.id.slice(0, -"-fragment".length) as EquipmentSet;
    return Math.max(MIN_LISTING_CENTS, FRAGMENT_CENTS[SET_TIER[set] ?? 0]);
  }

  const tier = item.set ? SET_TIER[item.set] : 0;
  const reais = 3 + tier * 4 + enhancement * 0.35;

  return Math.max(MIN_LISTING_CENTS, Math.round(reais * 10) * 10);
}

export function saleDelayMs(priceCents: number, suggestedCents: number): number | null {
  const ratio = priceCents / Math.max(1, suggestedCents);
  if (ratio <= 1.05) return 5 * 60_000;
  if (ratio <= 1.5) return 30 * 60_000;
  if (ratio <= 2) return 3 * 60 * 60_000;
  return null;
}
