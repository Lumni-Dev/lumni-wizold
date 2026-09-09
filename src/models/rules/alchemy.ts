import { levelRequirement, levelYield } from "@/shared/constants/tuning";
import { ALCHEMY_MAX_LEVEL } from "../data/alchemy";
import type { AlchemyState } from "../entities/alchemy";

// The cauldron climbs exactly what the mine climbs, which is the character's
// own experience curve: everything that evolves in this game asks the same
// ladder, and a brew pays what a level of it pays.
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

// A ladder holding more progress than its level asks settles on the next read,
// so a save banked against another curve never leaves the bar past its own end.
export function settleAlchemy(alchemy: AlchemyState): AlchemyState {
  return applyAlchemyProgress(alchemy, 0).alchemy;
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
