import { huntPurse } from "../data/species";
import { MAX_CHARACTER_LEVEL } from "@/shared/constants/game";
import { clamp } from "@/shared/utils/format";
import { intBetween, type Random } from "@/shared/utils/random";
import type { LevelBand } from "../entities/creature";
import type { Hunter } from "../entities/ranking";
import type { CombatOpponent } from "./combat";
import { deriveStatsOf, type DerivedStats } from "./stats";

export const ARENA_BAND_RATIO = 0.12;
export const ARENA_MIN_BAND = 5;

export const ARENA_COOLDOWN_HOURS = 24;

const HOUR_MS = 3_600_000;

export function arenaCooldownLeft(lastDuelAt: string | undefined, now = Date.now()): number {
  if (!lastDuelAt) return 0;

  const elapsed = now - Date.parse(lastDuelAt);
  if (!Number.isFinite(elapsed)) return 0;

  return Math.max(0, ARENA_COOLDOWN_HOURS * HOUR_MS - elapsed);
}

export const ARENA_DAILY_ATTACKS = 3;

export interface ArenaCharges {
  left: number;
  used: number;

  returnsIn: number;
}

export function arenaCharges(duels: Record<string, string>, now = Date.now()): ArenaCharges {
  const spent = Object.values(duels)
    .map((at) => arenaCooldownLeft(at, now))
    .filter((left) => left > 0)
    .sort((first, second) => first - second);

  const left = Math.max(0, ARENA_DAILY_ATTACKS - spent.length);

  return {
    left,
    used: Math.min(ARENA_DAILY_ATTACKS, spent.length),
    returnsIn: left > 0 ? 0 : (spent[0] ?? 0),
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
      form: "werewolf",
      enhancements: hunter.enhancements,
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

export const ARENA_SPOILS_MIN_SHARE = 0.1;
export const ARENA_SPOILS_MAX_SHARE = 0.25;

export const ARENA_SPOILS_MIN_HUNTS = 1.5;
export const ARENA_SPOILS_MAX_HUNTS = 3;

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
