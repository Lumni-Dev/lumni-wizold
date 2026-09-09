import type { Item } from "../../entities/item";

export const EMPTY_FLASK_ID = "empty-flask";

// The one vessel of the cauldron: every brew spends exactly one. It sits in
// the market's Instruments shelf beside the scrolls, at a flat price, so the
// flask is never the cost of alchemy, the ingredients are.
export const EMPTY_FLASK: Item = {
  id: EMPTY_FLASK_ID,
  name: "Empty Flask",
  description:
    "Clear glass and a cork stopper. On its own it holds nothing but air; over the cauldron it is the difference between a potion and a puddle.",
  category: "tool",
  rarity: "common",
  price: 15,
  minLevel: 1,
  stackable: true,
  inMarket: true,
  effect: {},
};
