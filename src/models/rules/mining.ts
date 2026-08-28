import { MINING_MAX_LEVEL, type MiningState } from "../entities/mining";

export function miningNeeded(level: number): number {
  return Math.round(40 * level * (1 + level / 25));
}

export function miningYieldBonus(level: number): number {
  return 1 + Math.floor(level / 20);
}

export interface MiningOutcome {
  mining: MiningState;
  levelsGained: number;
}

export function applyMiningProgress(mining: MiningState, gain: number): MiningOutcome {
  let level = mining.level;
  let progress = mining.progress + Math.max(0, Math.round(gain));
  let levelsGained = 0;

  if (level < MINING_MAX_LEVEL && progress >= miningNeeded(level)) {
    progress = 0;
    level += 1;
    levelsGained = 1;
  }

  if (level >= MINING_MAX_LEVEL) progress = 0;

  return { mining: { level, progress }, levelsGained };
}
