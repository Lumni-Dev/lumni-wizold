import { MINING_DAILY_MININGS, MINING_RESET_HOUR_UTC } from "@/shared/constants/game";
import { type MiningState } from "../entities/mining";
import { MINING_MAX_LEVEL } from "../data/ores";

const DAY_MS = 24 * 60 * 60 * 1000;

export function miningNeeded(level: number): number {
  return Math.round(40 * level * (1 + level / 25));
}

export function miningPeriodStart(now: number): number {
  const at = new Date(now);
  let boundary = Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate(), MINING_RESET_HOUR_UTC);
  if (now < boundary) boundary -= DAY_MS;
  return boundary;
}

export function miningNextReset(now: number): number {
  return miningPeriodStart(now) + DAY_MS;
}

export function miningResetsInMs(now: number): number {
  return Math.max(0, miningNextReset(now) - now);
}

export function rolloverMining(mining: MiningState, now: number): MiningState {
  const period = miningPeriodStart(now);
  const stored = mining.windowStart ? Date.parse(mining.windowStart) : Number.NaN;
  if (!Number.isFinite(stored) || stored < period) {
    return { ...mining, windowStart: new Date(period).toISOString(), count: 0 };
  }
  return mining;
}

export function miningRemaining(mining: MiningState, now: number): number {
  return Math.max(0, MINING_DAILY_MININGS - rolloverMining(mining, now).count);
}

export function miningExhausted(mining: MiningState, now: number): boolean {
  return miningRemaining(mining, now) <= 0;
}

export function miningYieldBonus(level: number): number {
  return 1 + Math.floor(level / 40);
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

  return { mining: { ...mining, level, progress }, levelsGained };
}
