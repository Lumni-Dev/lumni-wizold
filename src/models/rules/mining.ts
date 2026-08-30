import { MINING_DAILY_BUDGET_MS, MINING_DAILY_WINDOW_MS } from "@/shared/constants/game";
import { MINING_MAX_LEVEL, type MiningState } from "../entities/mining";

export function miningNeeded(level: number): number {
  return Math.round(40 * level * (1 + level / 25));
}

// A day of mining is a rolling window: it opens on the first swing and lasts
// `MINING_DAILY_WINDOW_MS`, after which the spent time is wiped and a fresh
// budget begins on the next swing. Reading it is pure, so the client shows the
// same number the server enforces.
export function rolloverMining(mining: MiningState, now: number): MiningState {
  const opened = mining.windowStart ? Date.parse(mining.windowStart) : Number.NaN;
  const expired = !Number.isFinite(opened) || now - opened >= MINING_DAILY_WINDOW_MS;
  return expired ? { ...mining, windowStart: undefined, spentMs: 0 } : mining;
}

export function miningRemainingMs(mining: MiningState, now: number): number {
  return Math.max(0, MINING_DAILY_BUDGET_MS - rolloverMining(mining, now).spentMs);
}

export function miningExhausted(mining: MiningState, now: number): boolean {
  return miningRemainingMs(mining, now) <= 0;
}

// When the current window refills. Only meaningful while a window is open and
// spent; a fresh miner has nothing to wait for.
export function miningResetsAtMs(mining: MiningState, now: number): number {
  const rolled = rolloverMining(mining, now);
  const opened = rolled.windowStart ? Date.parse(rolled.windowStart) : now;
  return (Number.isFinite(opened) ? opened : now) + MINING_DAILY_WINDOW_MS;
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
