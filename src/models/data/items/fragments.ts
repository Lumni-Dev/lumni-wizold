import type { Item } from "../../entities/item";
import { SET_LABEL } from "../../entities/item";

const FRAGMENT_LINES = [
  { set: "bronze" as const, price: 15, rarity: "common" as const },
  { set: "silver" as const, price: 60, rarity: "uncommon" as const },
  { set: "gold" as const, price: 220, rarity: "rare" as const },
  { set: "diamond" as const, price: 700, rarity: "epic" as const },
  { set: "lunar" as const, price: 1800, rarity: "legendary" as const },
];

export const FRAGMENTS: readonly Item[] = FRAGMENT_LINES.map((line) => ({
  id: line.set + "-fragment",
  name: SET_LABEL[line.set] + " Fragment",
  description:
    "A shard torn from the " +
    SET_LABEL[line.set].toLowerCase() +
    " vein. No use as a weapon or an ornament: it is for the forge to strike again " +
    "at the piece you already wear, until it answers better than the body.",
  category: "material" as const,
  rarity: line.rarity,
  price: line.price,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
}));
