import { numbersFromEnv } from "@/shared/utils/env";

export const PROGRESSION = {
  yieldBase: 12,
  yieldPerStep: 7,
  forgeShare: 0.5,
} as const;

const XP_CURVE = numbersFromEnv(process.env.NEXT_PUBLIC_XP_CURVE, [50 / 3, 1, -6, 17, -12]);
const XP_SCALE = XP_CURVE[0];
const XP_POLY = XP_CURVE.slice(1);

function totalExperience(level: number): number {
  let poly = 0;
  for (const coefficient of XP_POLY) poly = poly * level + coefficient;
  return XP_SCALE * poly;
}

export function levelRequirement(step: number): number {
  return Math.max(1, Math.round(totalExperience(step + 1) - totalExperience(step)));
}

export function levelYield(step: number): number {
  return Math.round(PROGRESSION.yieldBase + PROGRESSION.yieldPerStep * step);
}

export function forgeRequirement(step: number): number {
  return Math.max(1, Math.round(levelRequirement(step) * PROGRESSION.forgeShare));
}
