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
//   health small   2+1 common    ~45 vs  50  (90%)
//   health medium  2+1 uncommon  ~105 vs 150 (70%)
//   health large   1+1 rare      ~225 vs 300 (75%)
//   rage small     4+3 uncommon  ~225 vs 300 (75%)
//   rage medium    2+2 rare      ~435 vs 600 (72%)
//   rage large     1 epic + 2 rare ~605 vs 900 (67%)
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
    first: { rarity: "common", quantity: 2 },
    second: { rarity: "common", quantity: 1 },
  },
  {
    potionId: "rage-potion-small",
    kind: "rage",
    size: "small",
    requiredLevel: 5,
    first: { rarity: "uncommon", quantity: 4 },
    second: { rarity: "uncommon", quantity: 3 },
  },
  {
    potionId: "health-potion-medium",
    kind: "health",
    size: "medium",
    requiredLevel: 15,
    first: { rarity: "uncommon", quantity: 2 },
    second: { rarity: "uncommon", quantity: 1 },
  },
  {
    potionId: "rage-potion-medium",
    kind: "rage",
    size: "medium",
    requiredLevel: 25,
    first: { rarity: "rare", quantity: 2 },
    second: { rarity: "rare", quantity: 2 },
  },
  {
    potionId: "health-potion-large",
    kind: "health",
    size: "large",
    requiredLevel: 40,
    first: { rarity: "rare", quantity: 1 },
    second: { rarity: "rare", quantity: 1 },
  },
  {
    potionId: "rage-potion-large",
    kind: "rage",
    size: "large",
    requiredLevel: 60,
    first: { rarity: "epic", quantity: 1 },
    second: { rarity: "rare", quantity: 2 },
  },
];

// The ceiling is the deepest ritual: past it there is nothing left to open,
// which is why it is read off the table instead of written by hand.
export const ALCHEMY_MAX_LEVEL = ALCHEMY_RECIPES.reduce(
  (deepest, recipe) => Math.max(deepest, recipe.requiredLevel),
  1,
);

// Every recipe is written on a scroll the market sells, spent with the flask
// at each brew: the ritual is the parchment, and buying it is what opens the
// potion to the cauldron.
export const SCROLL_PRICE = 10;

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
