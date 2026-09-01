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
import { enhancedEffect } from "./forge";
import { moonAttributeBonus, type MoonPhaseKey } from "./moon";
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

  furyActive?: boolean;

  petAttributes?: Attributes;
}

export function deriveStats(
  character: Character,
  equipment: Equipment,
  pet: Pet | null = null,
  moonPhase?: MoonPhaseKey,
): DerivedStats {
  const furyActive = character.furyUntil ? Date.now() < Date.parse(character.furyUntil) : false;
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
  const sky = moonAttributeBonus(moonPhase);

  const trained = subject.attributes;
  const equipped = equipmentAttributes(equipment);
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
