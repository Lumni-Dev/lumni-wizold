import { MAX_CHARACTER_LEVEL } from "@/shared/constants/game";
import type { PotionKind, PotionSize, Rarity } from "../entities/item";

// Alchemy turns the hunt's spoils into the market's own potions. Every brew
// spends one empty flask plus two DIFFERENT materials the player chooses, and
// each ingredient slot asks a minimum rarity: any material at that rarity or
// above serves, so the cauldron never strands a band, the low bands feed it
// commons and the last bands feed it epics, across all 1000 levels.
//
// The quantities are priced against what the same materials would fetch at the
// market counter (sell value: half the catalog price plus the 5 WCoin carcass
// bonus, so common 10, uncommon 30, rare 105, epic 380, legendary 1405).
// Brewing with the cheapest qualifying materials always lands under the
// market price of the potion, which is the reward for hunting instead of
// paying, without ever making the shelf pointless:
//
//   health small   1+1 common      40 vs  50  (80%)
//   health medium  2+1 uncommon   120 vs 150  (80%)
//   health large   1+1 rare       255 vs 300  (85%)
//   rage small     4+3 uncommon   255 vs 300  (85%)
//   rage medium    2+2 rare       495 vs 600  (82%)
//   rage large     1 epic + 2 rare 695 vs 900  (77%)
//
// The fury line is the endgame sink on purpose: only the beast hunts, so the
// rage flask is the consumable a long run never stops needing, and its large
// size eats the epics only the deep bands drop.

export interface AlchemyIngredient {
  rarity: Rarity;
  quantity: number;
}

export interface AlchemyRecipe {
  potionId: string;
  kind: PotionKind;
  size: PotionSize;
  // What the cauldron's own ladder must reach for this ritual to work. The
  // fury line always sits a step above its health twin: it is the flask a
  // long endgame never stops needing.
  requiredLevel: number;
  first: AlchemyIngredient;
  second: AlchemyIngredient;
}

export const ALCHEMY_RECIPES: readonly AlchemyRecipe[] = [
  {
    potionId: "health-potion-small",
    kind: "health",
    size: "small",
    requiredLevel: 1,
    first: { rarity: "common", quantity: 1 },
    second: { rarity: "common", quantity: 1 },
  },
  {
    potionId: "rage-potion-small",
    kind: "rage",
    size: "small",
    requiredLevel: 101,
    first: { rarity: "uncommon", quantity: 4 },
    second: { rarity: "uncommon", quantity: 3 },
  },
  {
    potionId: "health-potion-medium",
    kind: "health",
    size: "medium",
    requiredLevel: 301,
    first: { rarity: "uncommon", quantity: 2 },
    second: { rarity: "uncommon", quantity: 1 },
  },
  {
    potionId: "rage-potion-medium",
    kind: "rage",
    size: "medium",
    requiredLevel: 501,
    first: { rarity: "rare", quantity: 2 },
    second: { rarity: "rare", quantity: 2 },
  },
  {
    potionId: "health-potion-large",
    kind: "health",
    size: "large",
    requiredLevel: 701,
    first: { rarity: "rare", quantity: 1 },
    second: { rarity: "rare", quantity: 1 },
  },
  {
    potionId: "rage-potion-large",
    kind: "rage",
    size: "large",
    requiredLevel: 901,
    first: { rarity: "epic", quantity: 1 },
    second: { rarity: "rare", quantity: 2 },
  },
];

// The cauldron climbs the whole ladder the mine climbs, and its rituals open
// along it the way the veins do: one at the foot and the rest spread to the
// last band, so alchemy is a run of its own, not an afternoon.
export const ALCHEMY_MAX_LEVEL = MAX_CHARACTER_LEVEL;

// Every recipe is written on a scroll the market sells, spent with the flask
// at each brew: the ritual is the parchment, and buying it is what opens the
// potion to the cauldron. A scroll is priced off the potion it makes, a tenth
// of the shelf, so a deeper ritual costs what it is worth and the parchment
// follows the potion for good, instead of a flat price the last bands would
// not feel. With the flask and the materials it leads to a brew at 77% to 85%
// of what the same potion costs on the shelf: brewing is always the thrifty
// path, and never a free one.
export const SCROLL_PRICE_RATIO = 0.1;

export function scrollIdFor(potionId: string): string {
  return "scroll-" + potionId;
}

const RECIPE_INDEX = new Map(ALCHEMY_RECIPES.map((recipe) => [recipe.potionId, recipe]));

export function alchemyRecipeOf(potionId: string): AlchemyRecipe | undefined {
  return RECIPE_INDEX.get(potionId);
}

export const RARITY_RANK: Record<Rarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

export function meetsRarityFloor(rarity: Rarity, floor: Rarity): boolean {
  return RARITY_RANK[rarity] >= RARITY_RANK[floor];
}
