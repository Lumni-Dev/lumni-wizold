import { ECONOMY } from "@/shared/config/economy";
import type { Character } from "../entities/character";

export const VIP_PRICE_CENTS = ECONOMY.vipPriceCents;
export const VIP_DAYS = 30;
/** Free VIP window granted on the first night. */
export const VIP_TRIAL_DAYS = 7;

type VipView = Pick<Character, "vipUntil" | "vipSubscriptionId" | "vipCanceling">;

export function isVip(character: VipView | null, now: number): boolean {
  return (
    character !== null &&
    character.vipUntil !== undefined &&
    Date.parse(character.vipUntil) > now
  );
}

export function hasVipSubscription(character: VipView | null): boolean {
  return (character?.vipSubscriptionId ?? "") !== "";
}

export function vipTrialUntil(fromMs = Date.now()): string {
  return new Date(fromMs + VIP_TRIAL_DAYS * 86_400_000).toISOString();
}

/** Stamps a trial only when the hunter has no live VIP window. */
export function withVipTrial(character: Character, fromMs = Date.now()): Character {
  if (character.vipUntil && Date.parse(character.vipUntil) > fromMs) return character;
  return { ...character, vipUntil: vipTrialUntil(fromMs) };
}
