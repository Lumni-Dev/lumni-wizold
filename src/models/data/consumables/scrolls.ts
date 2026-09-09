import { ALCHEMY_RECIPES, SCROLL_PRICE_RATIO, scrollIdFor } from "../alchemy";
import { SIZE_LABEL, type Item } from "../../entities/item";
import { POTIONS } from "./potions";

const KIND_LABEL = { health: "Health", rage: "Fury" } as const;

// One scroll per recipe, sold flat in the market's Instruments shelf and spent
// at every brew beside the flask. It carries the potion's own level gate, so a
// band cannot buy the ritual of a potion it could not drink.
export const SCROLLS: readonly Item[] = ALCHEMY_RECIPES.map((recipe) => {
  const potion = POTIONS.find((entry) => entry.id === recipe.potionId);
  return {
    id: scrollIdFor(recipe.potionId),
    name: SIZE_LABEL[recipe.size] + " " + KIND_LABEL[recipe.kind] + " Scroll",
    description:
      "The ritual written by a hand long gone: what goes into the cauldron, in what measure, and in what order. The parchment burns with the brew.",
    category: "tool" as const,
    rarity: "common" as const,
    price: Math.max(1, Math.round((potion?.price ?? 100) * SCROLL_PRICE_RATIO)),
    minLevel: potion?.minLevel ?? 1,
    stackable: true,
    inMarket: true,
    effect: {},
  };
});
