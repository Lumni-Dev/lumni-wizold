import {
  BASE_ATTRIBUTE_VALUE,
  BASE_VITAL,
  HEALTH_PER_ENDURANCE,
  HEALTH_PER_LEVEL,
  RAGE_PER_LEVEL,
  RAGE_PER_WILLPOWER,
  WEREWOLF_STRENGTH_BONUS,
} from "@/shared/constants/game";
import { clamp } from "@/shared/utils/format";
import { addAttributes, emptyAttributes, type Attributes } from "../entities/attribute";
import { EQUIPMENT_SLOTS, type Equipment } from "../entities/item";
import type { Character, Form } from "../entities/character";
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

  form: Attributes;
}

export interface DerivedStats {
  totalAttributes: Attributes;
  sources: StatSources;
  maxHealth: number;
  maxRage: number;
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

function formAttributes(form: Form, before: Attributes): Attributes {
  if (form === "human") return emptyAttributes();
  return {
    ...emptyAttributes(),
    strength: Math.round(before.strength * WEREWOLF_STRENGTH_BONUS),
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
  form: Form;

  petAttributes?: Attributes;

  enhancements?: Record<string, number>;
}

export function deriveStats(
  character: Character,
  equipment: Equipment,
  pet: Pet | null = null,
  enhancements: Record<string, number> = {},
): DerivedStats {
  return deriveStatsOf({ ...character, petAttributes: petBonus(pet), enhancements }, equipment);
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

  const body = [equipped, pet, moon].reduce(addAttributes, trained);
  const form = formAttributes(subject.form, body);
  const total = addAttributes(body, form);

  const maxHealth = Math.round(
    BASE_VITAL +
      (total.endurance - BASE_ATTRIBUTE_VALUE) * HEALTH_PER_ENDURANCE +
      subject.level * HEALTH_PER_LEVEL,
  );
  const maxRage = Math.round(
    BASE_VITAL +
      (total.willpower - BASE_ATTRIBUTE_VALUE) * RAGE_PER_WILLPOWER +
      subject.level * RAGE_PER_LEVEL,
  );

  return {
    totalAttributes: total,
    sources: { trained, equipment: equipped, pet, moon, form },
    maxHealth,
    maxRage,
    dodge: dodgeOf(total.agility),
    critical: criticalOf(total.instinct),
    experienceNeeded: experienceForLevel(subject.level),
  };
}

export function clampVitals(character: Character, stats: DerivedStats): Character {
  const health = clamp(Math.round(character.health), 0, stats.maxHealth);
  const rage = clamp(Math.round(character.rage), 0, stats.maxRage);
  if (health === character.health && rage === character.rage) return character;
  return { ...character, health, rage };
}
