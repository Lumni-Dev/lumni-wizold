import { XP_CURVE, PROGRESSION_TUNING } from "@/shared/config/progression";

export const PROGRESSION = PROGRESSION_TUNING;

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
  return levelRequirement(step);
}
