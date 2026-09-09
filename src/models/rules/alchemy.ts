import { levelRequirement, levelYield } from "@/shared/constants/tuning";
import { ALCHEMY_MAX_LEVEL } from "../data/alchemy";
import type { AlchemyState } from "../entities/alchemy";

// The cauldron climbs the same family of curves the mine climbs: what a level
// asks and what a landed brew pays are the shared progression rules, so the
// ladder never needs a formula of its own.
export function alchemyNeeded(level: number): number {
  return levelRequirement(level);
}

export function alchemyEffort(level: number): number {
  return levelYield(level);
}

export interface AlchemyOutcome {
  alchemy: AlchemyState;
  levelsGained: number;
}

export function applyAlchemyProgress(alchemy: AlchemyState, gain: number): AlchemyOutcome {
  let level = alchemy.level;
  let progress = alchemy.progress + Math.max(0, Math.round(gain));
  let levelsGained = 0;

  while (level < ALCHEMY_MAX_LEVEL && progress >= alchemyNeeded(level)) {
    progress -= alchemyNeeded(level);
    level += 1;
    levelsGained += 1;
  }

  if (level >= ALCHEMY_MAX_LEVEL) progress = 0;

  return { alchemy: { level, progress }, levelsGained };
}
