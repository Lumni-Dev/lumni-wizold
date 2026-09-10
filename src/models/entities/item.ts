import type { Attributes } from "./attribute";
import type { Gender } from "./character";

export type EquipmentSlot = "claw" | "helmet" | "armor" | "pants" | "boots" | "ring" | "necklace";

export type ItemCategory = EquipmentSlot | "potion" | "material" | "pet" | "tool";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type EquipmentSet = "bronze" | "silver" | "gold" | "diamond" | "lunar";

export type PotionKind = "health" | "rage";

export type PotionSize = "small" | "medium" | "large";

export interface ItemEffect {
  attributes?: Partial<Attributes>;
  health?: number;
  healthMin?: number;
  healthMax?: number;
  petEnergyRatio?: number;
  healthRatio?: number;
  furyMinutes?: number;
  // How deep the flask lights the beast: the fury bonus it lends to every
  // attribute while it lasts. It rides with the item, so a size is a row of
  // the potion table and never a branch in the rules.
  furyBonus?: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  rarity: Rarity;
  price: number;
  huntCost?: number;
  minLevel: number;
  stackable: boolean;
  inMarket: boolean;
  effect: ItemEffect;
  set?: EquipmentSet;
  lineage?: Gender;
  potion?: PotionKind;
  size?: PotionSize;
}

export interface InventorySlot {
  itemId: string;
  quantity: number;
  enhancement: number;
}

export interface EquippedPiece {
  itemId: string;
  enhancement: number;
}

export type Equipment = Record<EquipmentSlot, EquippedPiece | null>;

export const EQUIPMENT_SLOTS: readonly EquipmentSlot[] = [
  "helmet",
  "necklace",
  "armor",
  "pants",
  "boots",
  "claw",
  "ring",
];

export const EQUIPMENT_SET_KEYS: readonly EquipmentSet[] = [
  "bronze",
  "silver",
  "gold",
  "diamond",
  "lunar",
];

export const SET_LABEL: Record<EquipmentSet, string> = {
  bronze: "Bronze",
  silver: "Metal",
  gold: "Gold",
  diamond: "Diamond",
  lunar: "Lunar",
};

export const POTION_SIZES: readonly PotionSize[] = ["small", "medium", "large"];

export const SIZE_LABEL: Record<PotionSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

export const SLOT_LABEL: Record<EquipmentSlot, string> = {
  claw: "Gloves",
  helmet: "Cap",
  armor: "Coat",
  pants: "Pants",
  boots: "Boots",
  ring: "Ring",
  necklace: "Necklace",
};

export const CATEGORY_LABEL: Record<ItemCategory, string> = {
  claw: "Gloves",
  helmet: "Cap",
  armor: "Coat",
  pants: "Pants",
  boots: "Boots",
  ring: "Ring",
  necklace: "Necklace",
  potion: "Potion",
  material: "Material",
  pet: "Companion",
  tool: "Instrument",
};

export const CATEGORY_PLURAL: Record<ItemCategory, string> = {
  claw: "Gloves",
  helmet: "Caps",
  armor: "Coats",
  pants: "Pants",
  boots: "Boots",
  ring: "Rings",
  necklace: "Necklaces",
  potion: "Potions",
  material: "Materials",
  pet: "Companion",
  tool: "Instruments",
};

export const ITEM_CATEGORIES: readonly ItemCategory[] = [
  ...EQUIPMENT_SLOTS,
  "potion",
  "tool",
  "pet",
  "material",
];

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

export function emptyEquipment(): Equipment {
  return {
    claw: null,
    helmet: null,
    armor: null,
    pants: null,
    boots: null,
    ring: null,
    necklace: null,
  };
}

export function isEquippable(item: Item): item is Item & { category: EquipmentSlot } {
  return (EQUIPMENT_SLOTS as readonly string[]).includes(item.category);
}
