import {
  BASE_ATTRIBUTE_VALUE,
  BASE_VITAL,
  FURY_ATTRIBUTE_BONUS,
  HEALTH_PER_ENDURANCE,
  HEALTH_PER_LEVEL,
} from "@/shared/constants/game";
import { clamp } from "@/shared/utils/format";
import { addAttributes, emptyAttributes, type Attributes } from "../entities/attribute";
import { EQUIPMENT_SLOTS, type Equipment } from "../entities/item";
import type { Character } from "../entities/character";
import type { Pet } from "../entities/pet";
import { findItem } from "../data/items";
import { enhancedEffect, enhancementOf } from "./forge";
import { moonAttributeBonus } from "./moon";
import { petBonus } from "./pet";
import { experienceForLevel } from "./progression";

export interface StatSources {
  trained: Attributes;
  equipment: Attributes;
  pet: Attributes;

  moon: Attributes;

  // The fury-potion buff: a flat bonus to every attribute while it is active.
  fury: Attributes;
}

export interface DerivedStats {
  totalAttributes: Attributes;
  sources: StatSources;
  maxHealth: number;
  dodge: number;
  critical: number;
  experienceNeeded: number;
}

function dodgeOf(agility: number): number {
  return clamp(Math.round((35 * agility) / (agility + 120)), 0, 35);
}

function criticalOf(instinct: number): number {
  return clamp(Math.round(5 + (40 * instinct) / (instinct + 250)), 0, 45);
}

function furyAttributes(active: boolean): Attributes {
  if (!active) return emptyAttributes();
  return {
    strength: FURY_ATTRIBUTE_BONUS,
    agility: FURY_ATTRIBUTE_BONUS,
    endurance: FURY_ATTRIBUTE_BONUS,
    instinct: FURY_ATTRIBUTE_BONUS,
    willpower: FURY_ATTRIBUTE_BONUS,
  };
}

function equipmentAttributes(
  equipment: Equipment,
  enhancements: Record<string, number> = {},
): Attributes {
  let attributes = emptyAttributes();

  for (const slot of EQUIPMENT_SLOTS) {
    const itemId = equipment[slot];
    if (!itemId) continue;
    const item = findItem(itemId);
    if (!item) continue;

    const effect = enhancedEffect(item, enhancementOf(enhancements, itemId));
    if (effect.attributes) attributes = addAttributes(attributes, effect.attributes);
  }

  return attributes;
}

export interface StatSubject {
  level: number;
  attributes: Attributes;

  // Whether the fury-potion buff is active. The caller decides it from furyUntil
  // and the current time, so this derivation stays pure and testable.
  furyActive?: boolean;

  petAttributes?: Attributes;

  enhancements?: Record<string, number>;
}

export function deriveStats(
  character: Character,
  equipment: Equipment,
  pet: Pet | null = null,
  enhancements: Record<string, number> = {},
): DerivedStats {
  const furyActive = character.furyUntil ? Date.now() < Date.parse(character.furyUntil) : false;
  return deriveStatsOf(
    { ...character, furyActive, petAttributes: petBonus(pet), enhancements },
    equipment,
  );
}

export function deriveStatsOf(subject: StatSubject, equipment: Equipment): DerivedStats {
  const sky = moonAttributeBonus();

  const trained = subject.attributes;
  const equipped = equipmentAttributes(equipment, subject.enhancements ?? {});
  const pet = subject.petAttributes ?? emptyAttributes();
  const moon: Attributes = {
    strength: sky,
    agility: sky,
    endurance: sky,
    instinct: sky,
    willpower: sky,
  };
  const fury = furyAttributes(subject.furyActive === true);

  const total = [equipped, pet, moon, fury].reduce(addAttributes, trained);

  const maxHealth = Math.round(
    BASE_VITAL +
      (total.endurance - BASE_ATTRIBUTE_VALUE) * HEALTH_PER_ENDURANCE +
      subject.level * HEALTH_PER_LEVEL,
  );

  return {
    totalAttributes: total,
    sources: { trained, equipment: equipped, pet, moon, fury },
    maxHealth,
    dodge: dodgeOf(total.agility),
    critical: criticalOf(total.instinct),
    experienceNeeded: experienceForLevel(subject.level),
  };
}

export function clampVitals(character: Character, stats: DerivedStats): Character {
  const health = clamp(Math.round(character.health), 0, stats.maxHealth);
  if (health === character.health) return character;
  return { ...character, health };
}
