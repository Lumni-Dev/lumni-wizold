import { ARENA } from "@/shared/config/arena";
import { huntPurse } from "./economy";
import { MAX_CHARACTER_LEVEL, MINING_RESET_HOUR_UTC } from "@/shared/constants/game";
import { clamp } from "@/shared/utils/format";
import { intBetween, type Random } from "@/shared/utils/random";
import type { LevelBand } from "../entities/creature";
import type { Hunter } from "../entities/ranking";
import type { CombatOpponent } from "./combat";
import { deriveStatsOf, type DerivedStats } from "./stats";

export const ARENA_BAND_RATIO = ARENA.bandRatio;
export const ARENA_MIN_BAND = ARENA.minBand;

const DAY_MS = 86_400_000;

export function arenaPeriodStart(now: number): number {
  const at = new Date(now);
  let boundary = Date.UTC(
    at.getUTCFullYear(),
    at.getUTCMonth(),
    at.getUTCDate(),
    MINING_RESET_HOUR_UTC,
  );
  if (now < boundary) boundary -= DAY_MS;
  return boundary;
}

export function arenaResetsInMs(now: number): number {
  return Math.max(0, arenaPeriodStart(now) + DAY_MS - now);
}

export function arenaCooldownLeft(lastDuelAt: string | undefined, now = Date.now()): number {
  if (!lastDuelAt) return 0;

  const stamp = Date.parse(lastDuelAt);
  if (!Number.isFinite(stamp)) return 0;

  return stamp >= arenaPeriodStart(now) ? arenaResetsInMs(now) : 0;
}

export const ARENA_DAILY_ATTACKS = ARENA.dailyAttacks;

export interface ArenaCharges {
  left: number;
  used: number;

  returnsIn: number;
}

export function arenaCharges(duels: Record<string, string>, now = Date.now()): ArenaCharges {
  const period = arenaPeriodStart(now);
  const used = Object.values(duels).filter((at) => {
    const stamp = Date.parse(at);
    return Number.isFinite(stamp) && stamp >= period;
  }).length;

  const left = Math.max(0, ARENA_DAILY_ATTACKS - used);

  return {
    left,
    used: Math.min(ARENA_DAILY_ATTACKS, used),
    returnsIn: left > 0 ? 0 : arenaResetsInMs(now),
  };
}

export function arenaBand(level: number): LevelBand {
  const width = Math.max(ARENA_MIN_BAND, Math.round(level * ARENA_BAND_RATIO));
  return {
    start: clamp(level - width, 1, MAX_CHARACTER_LEVEL),
    end: clamp(level + width, 1, MAX_CHARACTER_LEVEL),
  };
}

export function isInBand(band: LevelBand, level: number): boolean {
  return level >= band.start && level <= band.end;
}

export function arenaStats(hunter: Hunter): DerivedStats {
  return deriveStatsOf(
    {
      level: hunter.level,
      attributes: hunter.attributes,
    },
    hunter.equipment,
  );
}

function combatantOf(hunter: Hunter, stats: DerivedStats): CombatOpponent {
  return {
    name: hunter.name,
    health: stats.maxHealth,
    strength: stats.totalAttributes.strength,
    endurance: stats.totalAttributes.endurance,
    agility: stats.totalAttributes.agility,
  };
}

export function arenaCombatant(hunter: Hunter): CombatOpponent {
  return combatantOf(hunter, arenaStats(hunter));
}

export const ARENA_SPOILS_MIN_SHARE = ARENA.spoilsMinShare;
export const ARENA_SPOILS_MAX_SHARE = ARENA.spoilsMaxShare;

export const ARENA_SPOILS_MIN_HUNTS = ARENA.spoilsMinHunts;
export const ARENA_SPOILS_MAX_HUNTS = ARENA.spoilsMaxHunts;

export interface SpoilsRange {
  min: number;
  max: number;
}

export function arenaSpoilsRange(level: number): SpoilsRange {
  const purse = huntPurse(level);
  return {
    min: Math.round(purse * ARENA_SPOILS_MIN_HUNTS),
    max: Math.round(purse * ARENA_SPOILS_MAX_HUNTS),
  };
}

export function arenaSpoils(level: number, loserBronze: number, random: Random): number {
  const bag = Math.max(0, Math.round(loserBronze));
  const { min, max } = arenaSpoilsRange(level);
  const share = intBetween(ARENA_SPOILS_MIN_SHARE * 100, ARENA_SPOILS_MAX_SHARE * 100, random);

  return Math.min(intBetween(min, max, random), Math.round((bag * share) / 100));
}
