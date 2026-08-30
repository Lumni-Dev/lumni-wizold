import type { AttributeKey } from "@/models/entities/attribute";
import type { EquipmentSet, EquipmentSlot, Rarity } from "@/models/entities/item";

export interface SlotBlueprint {
  noun: string;
  feminine: boolean;
  flavor: string;
  attributes: Partial<Record<AttributeKey, number>>;
  priceFactor: number;
}

export interface SetDefinition {
  key: EquipmentSet;
  label: string;
  suffixMasculine: string;
  suffixFeminine: string;
  rarity: Rarity;
  minLevel: number;
  inMarket: boolean;
  description: string;
  flavor: string;
  power: number;
  // The set's price unit, decoupled from `power` (which is huge for combat and would
  // blow past the vault). A piece costs priceFactor x priceBase; a full set is 95 x it.
  priceBase: number;
}

export type { EquipmentSet, EquipmentSlot, Rarity };
