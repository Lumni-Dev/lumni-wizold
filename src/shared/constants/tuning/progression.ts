export const PROGRESSION = {
  requirementBase: 100,
  requirementDivisor: 25,
  yieldBase: 12,
  yieldPerStep: 7,
  forgeShare: 0.5,
} as const;

export function levelRequirement(step: number): number {
  return Math.round(
    PROGRESSION.requirementBase * step * (1 + step / PROGRESSION.requirementDivisor),
  );
}

export function levelYield(step: number): number {
  return Math.round(PROGRESSION.yieldBase + PROGRESSION.yieldPerStep * step);
}

export function forgeRequirement(step: number): number {
  return Math.max(1, Math.round(levelRequirement(step) * PROGRESSION.forgeShare));
}
