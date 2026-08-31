import { numberFromEnv } from "@/shared/utils/env";
import type { Character } from "../entities/character";

export const VIP_PRICE_CENTS = numberFromEnv(process.env.NEXT_PUBLIC_VIP_PRICE_CENTS, 500);
export const VIP_DAYS = 30;

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
