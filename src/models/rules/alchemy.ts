import { ALCHEMY_MAX_LEVEL } from "../data/alchemy";
import type { AlchemyState } from "../entities/alchemy";

// The cauldron cannot borrow the hunter's curve. That one is cubic because a
// carcass pays more every band; a brew pays what its ritual pays and nothing
// else, so the same curve asked 3.5 million brews for the thousandth level,
// which is 200 days of bars. The ladder is its own straight line instead:
// what a level costs grows by a fixed step, and the rituals opening along the
// way (20 xp at the foot, 1000 at the last) keep the climb even. Measured end
// to end that is about 9.100 brews, some 13 hours of bars plus the hunts that
// feed them, for a profession that spans the whole thousand.
export const ALCHEMY_XP_BASE = 30;
export const ALCHEMY_XP_PER_LEVEL = 4;

export function alchemyNeeded(level: number): number {
  return ALCHEMY_XP_BASE + ALCHEMY_XP_PER_LEVEL * level;
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
