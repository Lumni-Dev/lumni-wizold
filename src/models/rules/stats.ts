import {
  BASE_ATTRIBUTE_VALUE,
  BASE_VITAL,
  FURY_MOON_ATTRIBUTE_BONUS,
  HEALTH_PER_ENDURANCE,
} from "@/shared/constants/game";
import { healthPerLevelFor } from "@/shared/constants/tuning/vitals";
import { clamp } from "@/shared/utils/format";
import { addAttributes, emptyAttributes, type Attributes } from "../entities/attribute";
import { EQUIPMENT_SLOTS, type Equipment } from "../entities/item";
import type { Character, Gender } from "../entities/character";
import type { Pet } from "../entities/pet";
import { findItem } from "../data/items";
import { enhancedEffect } from "./forge";
import { isFullMoon, potionFuryRemainingMs, type MoonPhaseKey } from "./moon";
import { petBonus } from "./pet";
import { experienceForLevel } from "./progression";

export interface StatSources {
  trained: Attributes;
  equipment: Attributes;
  pet: Attributes;

  moon: Attributes;

  fury: Attributes;
}

export interface DerivedStats {
  totalAttributes: Attributes;
  sources: StatSources;
  maxHealth: number;
  dodge: number;
  critical: number;
  // The exact curves, unrounded, for the sheet: combat keeps rolling on the
  // rounded pair above, so showing 20.33 never changes a fight.
  dodgeExact: number;
  criticalExact: number;
  experienceNeeded: number;
}

/** Asymptotic ceiling of dodge chance (%). */
export const DODGE_CHANCE_CAP = 35;

/** Asymptotic ceiling of critical chance (%): base 5 + soft 40. */
export const CRITICAL_CHANCE_CAP = 45;

function dodgeExactOf(agility: number): number {
  return clamp((35 * agility) / (agility + 120), 0, DODGE_CHANCE_CAP);
}

function criticalExactOf(instinct: number): number {
  return clamp(5 + (40 * instinct) / (instinct + 250), 0, CRITICAL_CHANCE_CAP);
}

function dodgeOf(agility: number): number {
  return Math.round(dodgeExactOf(agility));
}

function criticalOf(instinct: number): number {
  return Math.round(criticalExactOf(instinct));
}

function furyAttributes(bonus: number): Attributes {
  if (bonus <= 0) return emptyAttributes();
  return {
    strength: bonus,
    agility: bonus,
    endurance: bonus,
    instinct: bonus,
    willpower: bonus,
  };
}

function equipmentAttributes(equipment: Equipment): Attributes {
  let attributes = emptyAttributes();

  for (const slot of EQUIPMENT_SLOTS) {
    const piece = equipment[slot];
    if (!piece) continue;
    const item = findItem(piece.itemId);
    if (!item) continue;

    const effect = enhancedEffect(item, piece.enhancement);
    if (effect.attributes) attributes = addAttributes(attributes, effect.attributes);
  }

  return attributes;
}

export interface StatSubject {
  level: number;
  attributes: Attributes;
  gender?: Gender;
  furyActive?: boolean;
  // How deep the running flask lit the beast. Absent while the fury is on, it
  // reads as the moon's own bonus, so a hunter handed over without a size,
  // the arena's rival and the ranking sheet, is never left lending nothing.
  furyBonus?: number;
  petAttributes?: Attributes;
}

export function deriveStats(
  character: Character,
  equipment: Equipment,
  pet: Pet | null = null,
  moonPhase?: MoonPhaseKey,
  now = Date.now(),
): DerivedStats {
  // Only the flask travels as furyActive: the sky is read again below, by the
  // phase alone, so a stale bonus left by an expired potion can never ride a
  // full moon.
  const furyActive = potionFuryRemainingMs(character, now) > 0;
  return deriveStatsOf(
    { ...character, furyActive, petAttributes: petBonus(pet) },
    equipment,
    moonPhase,
  );
}

export function deriveStatsOf(
  subject: StatSubject,
  equipment: Equipment,
  moonPhase?: MoonPhaseKey,
): DerivedStats {
  const trained = subject.attributes;
  const equipped = equipmentAttributes(equipment);
  const pet = subject.petAttributes ?? emptyAttributes();
  const moon = emptyAttributes();
  const potionBonus =
    subject.furyActive === true ? subject.furyBonus ?? FURY_MOON_ATTRIBUTE_BONUS : 0;
  const skyBonus = isFullMoon(moonPhase) ? FURY_MOON_ATTRIBUTE_BONUS : 0;
  const fury = furyAttributes(Math.max(potionBonus, skyBonus));

  const total = [equipped, pet, moon, fury].reduce(addAttributes, trained);

  const maxHealth = Math.round(
    BASE_VITAL +
      (total.endurance - BASE_ATTRIBUTE_VALUE) * HEALTH_PER_ENDURANCE +
      Math.max(0, subject.level - 1) * healthPerLevelFor(subject.gender ?? "male"),
  );

  return {
    totalAttributes: total,
    sources: { trained, equipment: equipped, pet, moon, fury },
    maxHealth,
    dodge: dodgeOf(total.agility),
    critical: criticalOf(total.instinct),
    dodgeExact: dodgeExactOf(total.agility),
    criticalExact: criticalExactOf(total.instinct),
    experienceNeeded: experienceForLevel(subject.level),
  };
}

export function clampVitals(character: Character, stats: DerivedStats): Character {
  const health = clamp(Math.round(character.health), 0, stats.maxHealth);
  if (health === character.health) return character;
  return { ...character, health };
}
