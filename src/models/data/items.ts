import { findGender, type Gender } from "../entities/character";
import type { Item } from "../entities/item";
import { buildSetItems } from "./equipment-sets";
import { ALL_MATERIALS } from "./items/materials";
import { POTIONS, PET_SUPPLIES } from "./consumables";

const FRAGMENT_LINES = [
  { set: "bronze", label: "Bronze", price: 15, rarity: "common" as const },
  { set: "silver", label: "Metal", price: 60, rarity: "uncommon" as const },
  { set: "gold", label: "Ouro", price: 220, rarity: "rare" as const },
  { set: "diamond", label: "Diamante", price: 700, rarity: "epic" as const },
  { set: "lunar", label: "Lunar", price: 1800, rarity: "legendary" as const },
];

const FRAGMENTS: readonly Item[] = FRAGMENT_LINES.map((line) => ({
  id: line.set + "-fragment",
  name: "Fragmento de " + line.label,
  description:
    "Lasca arrancada do veio de " +
    line.label.toLowerCase() +
    ". Não serve de arma nem de enfeite: serve para a forja bater de novo na peça " +
    "que você já usa, até ela responder melhor do que o corpo.",
  category: "material" as const,
  rarity: line.rarity,
  price: line.price,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
}));

export const ITEMS: readonly Item[] = [
  ...buildSetItems(),
  ...POTIONS,
  ...PET_SUPPLIES,
  ...FRAGMENTS,
  ...ALL_MATERIALS,
];

const ITEM_INDEX = new Map<string, Item>(ITEMS.map((item) => [item.id, item]));

export function itemIdFor(id: string, lineage: Gender): string {
  if (findItem(id)) return id;
  const split = id + "-" + lineage;
  return findItem(split) ? split : id;
}

export function servesLineage(item: Item, lineage: Gender): boolean {
  return item.lineage === undefined || item.lineage === lineage;
}

export function lineageName(item: Item): string {
  return item.lineage ? findGender(item.lineage).label : "";
}

export function findItem(itemId: string): Item | undefined {
  return ITEM_INDEX.get(itemId);
}

export function marketItems(): readonly Item[] {
  return ITEMS.filter((item) => item.inMarket);
}
