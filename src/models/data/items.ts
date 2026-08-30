import { findGender, type Gender } from "../entities/character";
import type { Item } from "../entities/item";
import { buildSetItems } from "./equipment-sets";
import { ALL_MATERIALS } from "./items/materials";
import { POTIONS, PET_SUPPLIES } from "./consumables";
import { FRAGMENTS } from "./items/fragments";

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
