import type { Attributes } from "./attribute";
import type { Gender } from "./character";

export type EquipmentSlot = "claw" | "helmet" | "armor" | "pants" | "boots" | "ring" | "necklace";

export type ItemCategory = EquipmentSlot | "potion" | "material" | "pet";

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
}

export interface Item {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  rarity: Rarity;
  price: number;
  image?: string;
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
  gold: "Ouro",
  diamond: "Diamante",
  lunar: "Lunar",
};

export const POTION_SIZES: readonly PotionSize[] = ["small", "medium", "large"];

export const SIZE_LABEL: Record<PotionSize, string> = {
  small: "Pequena",
  medium: "Média",
  large: "Grande",
};

export const SLOT_LABEL: Record<EquipmentSlot, string> = {
  claw: "Luvas",
  helmet: "Gorro",
  armor: "Casaco",
  pants: "Calças",
  boots: "Botas",
  ring: "Anel",
  necklace: "Colar",
};

export const CATEGORY_LABEL: Record<ItemCategory, string> = {
  claw: "Luvas",
  helmet: "Gorro",
  armor: "Casaco",
  pants: "Calças",
  boots: "Botas",
  ring: "Anel",
  necklace: "Colar",
  potion: "Poção",
  material: "Material",
  pet: "Mascote",
};

export const CATEGORY_PLURAL: Record<ItemCategory, string> = {
  claw: "Luvas",
  helmet: "Gorros",
  armor: "Casacos",
  pants: "Calças",
  boots: "Botas",
  ring: "Anéis",
  necklace: "Colares",
  potion: "Poções",
  material: "Materiais",
  pet: "Mascote",
};

export const ITEM_CATEGORIES: readonly ItemCategory[] = [
  ...EQUIPMENT_SLOTS,
  "potion",
  "pet",
  "material",
];

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
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
