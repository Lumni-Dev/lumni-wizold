import { MINING_DAILY_MININGS, MINING_RESET_HOUR_UTC } from "@/shared/constants/game";
import { MINING_MAX_LEVEL, type MiningState } from "../entities/mining";

const DAY_MS = 24 * 60 * 60 * 1000;

export function miningNeeded(level: number): number {
  return Math.round(40 * level * (1 + level / 25));
}

// The day resets at 06:00 America/Sao_Paulo (09:00 UTC) for everyone at once.
// This is the most recent boundary at or before `now`, so the count belongs to
// the period it opened in. Computing it is pure, so the client shows the same
// number the server enforces, and nobody needs a cron to run for it to hold.
export function miningPeriodStart(now: number): number {
  const at = new Date(now);
  let boundary = Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate(), MINING_RESET_HOUR_UTC);
  if (now < boundary) boundary -= DAY_MS;
  return boundary;
}

// When the count next refills: the next 06:00 São Paulo boundary.
export function miningNextReset(now: number): number {
  return miningPeriodStart(now) + DAY_MS;
}

export function miningResetsInMs(now: number): number {
  return Math.max(0, miningNextReset(now) - now);
}

// Wipes the count when it belongs to an earlier daily period, so the reset lands
// at 06:00 for everyone without any scheduled job firing.
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
  // Every 40 mining levels adds one to the multiplier (was every 20), so the
  // deep veins yield roughly half what they used to and feeding the pricier
  // forge is a real grind instead of a fragment fountain.
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
