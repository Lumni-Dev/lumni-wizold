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
  priceBase: number;
}

export type { EquipmentSet, EquipmentSlot, Rarity };
