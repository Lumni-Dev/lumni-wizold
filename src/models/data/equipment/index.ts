import type { AttributeKey } from "@/models/entities/attribute";
import type { Gender } from "@/models/entities/character";
import { EQUIPMENT_SLOTS, type EquipmentSet, type EquipmentSlot, type Item, type ItemEffect } from "@/models/entities/item";
import { SET_PIECE_PRICE } from "@/shared/config/equipment-economy";
import { SLOTS } from "./slots";
import { bronzeSet } from "./bronze";
import { silverSet } from "./silver";
import { goldSet } from "./gold";
import { diamondSet } from "./diamond";
import { lunarSet } from "./lunar";
import type { SetDefinition } from "./types";

export type { SetDefinition, SlotBlueprint } from "./types";
export { SLOTS } from "./slots";

export const EQUIPMENT_SETS: readonly SetDefinition[] = [
  bronzeSet,
  silverSet,
  goldSet,
  diamondSet,
  lunarSet,
];

export function setAttributes(definition: SetDefinition): Record<AttributeKey, number> {
  const total: Record<AttributeKey, number> = {
    strength: 0,
    agility: 0,
    endurance: 0,
    instinct: 0,
    willpower: 0,
  };

  for (const slot of EQUIPMENT_SLOTS) {
    const lent = scaleAttributes(SLOTS[slot].attributes, definition.power) ?? {};
    for (const [key, value] of Object.entries(lent) as [AttributeKey, number][]) {
      total[key] += value;
    }
  }

  return total;
}

export function setForLevel(level: number): SetDefinition {
  let owned = EQUIPMENT_SETS[0];
  for (const definition of EQUIPMENT_SETS) {
    if (definition.minLevel <= level) owned = definition;
  }
  return owned;
}

const LINEAGE_SLOT: EquipmentSlot = "armor";

export function pieceId(set: EquipmentSet, slot: EquipmentSlot, lineage?: Gender): string {
  const base = set + "-" + slot;
  return slot === LINEAGE_SLOT ? base + "-" + (lineage ?? "male") : base;
}

export function pieceName(definition: SetDefinition, slot: EquipmentSlot): string {
  const blueprint = SLOTS[slot];
  const suffix = blueprint.feminine ? definition.suffixFeminine : definition.suffixMasculine;
  return blueprint.noun + " " + suffix;
}

function scaleAttributes(
  shape: Partial<Record<AttributeKey, number>>,
  power: number,
): ItemEffect["attributes"] {
  const result: Partial<Record<AttributeKey, number>> = {};
  for (const [key, fraction] of Object.entries(shape) as [AttributeKey, number][]) {
    result[key] = Math.max(1, Math.round(fraction * power));
  }
  return result;
}

function pieceEffect(definition: SetDefinition, slot: EquipmentSlot): ItemEffect {
  return { attributes: scaleAttributes(SLOTS[slot].attributes, definition.power) };
}

export function piecePrice(definition: SetDefinition): number {
  return SET_PIECE_PRICE[definition.key as EquipmentSet];
}

function pieceOf(definition: SetDefinition, slot: EquipmentSlot, lineage?: Gender): Item {
  return {
    id: pieceId(definition.key, slot, lineage),
    name: pieceName(definition, slot),
    description: SLOTS[slot].flavor + " " + definition.flavor,
    category: slot,
    rarity: definition.rarity,
    price: piecePrice(definition),
    minLevel: definition.minLevel,
    stackable: false,
    inMarket: definition.inMarket,
    effect: pieceEffect(definition, slot),
    set: definition.key,
    lineage,
  };
}

export function setTotalPrice(definition: SetDefinition): number {
  return EQUIPMENT_SLOTS.length * piecePrice(definition);
}

export function buildSetItems(): Item[] {
  return EQUIPMENT_SETS.flatMap((definition) =>
    EQUIPMENT_SLOTS.flatMap((slot) =>
      slot === LINEAGE_SLOT
        ? [pieceOf(definition, slot, "male"), pieceOf(definition, slot, "female")]
        : [pieceOf(definition, slot)],
    ),
  );
}
