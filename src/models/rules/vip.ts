import type { Character } from "../entities/character";

export const VIP_PRICE_CENTS = 500;
export const VIP_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export function isVip(character: Pick<Character, "vipUntil"> | null, now: number): boolean {
  return (
    character !== null &&
    character.vipUntil !== undefined &&
    Date.parse(character.vipUntil) > now
  );
}

export function vipUntilAfter(current: string | undefined, now: number): string {
  const base = current !== undefined && Date.parse(current) > now ? Date.parse(current) : now;
  return new Date(base + VIP_DAYS * DAY_MS).toISOString();
}
