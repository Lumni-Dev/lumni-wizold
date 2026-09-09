import { EMPTY_FLASK_ID } from "@/models/data/consumables";
import {
  ALCHEMY_MAX_LEVEL,
  ALCHEMY_RECIPES,
  alchemyRecipeOf,
  meetsRarityFloor,
  scrollIdFor,
  type AlchemyRecipe,
} from "@/models/data/alchemy";
import { alchemyEffort, alchemyNeeded, applyAlchemyProgress } from "@/models/rules/alchemy";
import { findItem } from "@/models/data/items";
import type { GameState } from "@/models/entities/game-state";
import type { Item, Rarity } from "@/models/entities/item";
import { failure, success, type Result } from "@/models/entities/result";
import { isForgeMaterial } from "@/models/rules/bazaar";
import { addToInventory, countInInventory, removeFromInventory } from "./inventory.controller";
import { addLog } from "./log.controller";

export interface AlchemyRow {
  recipe: AlchemyRecipe;
  potion: Item;
  scroll: Item | undefined;
  scrolls: number;
  unlocked: boolean;
}

export interface AlchemyView {
  rows: AlchemyRow[];
  flasks: number;
  level: number;
  progress: number;
  needed: number;
  maxLevel: number;
  // What one landed brew pays the ladder. It answers to the brewer's level,
  // not to the ritual, exactly as a mining strike does.
  effort: number;
}

export function listAlchemy(state: GameState): AlchemyView {
  const level = state.alchemy.level;
  const rows: AlchemyRow[] = [];
  for (const recipe of ALCHEMY_RECIPES) {
    const potion = findItem(recipe.potionId);
    if (!potion) continue;
    const scrollId = scrollIdFor(recipe.potionId);
    rows.push({
      recipe,
      potion,
      scroll: findItem(scrollId),
      scrolls: countInInventory(state.inventory, scrollId, 0),
      unlocked: level >= recipe.requiredLevel,
    });
  }
  return {
    rows,
    flasks: countInInventory(state.inventory, EMPTY_FLASK_ID, 0),
    level,
    progress: state.alchemy.progress,
    needed: alchemyNeeded(level),
    maxLevel: ALCHEMY_MAX_LEVEL,
    effort: alchemyEffort(level),
  };
}

export interface BrewMaterialOption {
  item: Item;
  owned: number;
}

// Every material of the bag at or above the slot's rarity serves, cheapest
// first, so the pick the screen offers is also the order a thrifty brewer
// would reach for. Forge fragments never enter the cauldron: they belong to
// the anvil alone.
export function listBrewMaterials(state: GameState, floor: Rarity): BrewMaterialOption[] {
  const options: BrewMaterialOption[] = [];
  for (const slot of state.inventory) {
    if (slot.enhancement > 0 || slot.quantity <= 0) continue;
    const item = findItem(slot.itemId);
    if (!item || item.category !== "material") continue;
    if (isForgeMaterial(item)) continue;
    if (!meetsRarityFloor(item.rarity, floor)) continue;
    options.push({ item, owned: slot.quantity });
  }
  return options.sort(
    (a, b) => a.item.price - b.item.price || a.item.name.localeCompare(b.item.name),
  );
}

function ingredientProblem(
  state: GameState,
  itemId: string,
  floor: Rarity,
  quantity: number,
): { failureMessage: string } | { item: Item } {
  const item = findItem(itemId);
  if (!item) return { failureMessage: "Unknown item." };
  if (item.category !== "material" || isForgeMaterial(item)) {
    return { failureMessage: "That ingredient does not serve the cauldron." };
  }
  if (!meetsRarityFloor(item.rarity, floor)) {
    return { failureMessage: "That ingredient is too plain for this potion." };
  }
  if (countInInventory(state.inventory, itemId, 0) < quantity) {
    return { failureMessage: "You do not have that many " + item.name + "." };
  }
  return { item };
}

export function brewPotion(
  state: GameState,
  potionId: string,
  firstId: string,
  secondId: string,
): Result {
  const character = state.character;
  if (!character) return failure(state, "No active character.");

  const recipe = alchemyRecipeOf(potionId);
  const potion = findItem(potionId);
  if (!recipe || !potion) return failure(state, "That potion is not brewed here.");
  // The cauldron answers to its own ladder, never to the hunter's level.
  if (state.alchemy.level < recipe.requiredLevel) {
    return failure(state, potion.name + " demands alchemy LV. " + recipe.requiredLevel + ".");
  }
  if (firstId === secondId) {
    return failure(state, "The cauldron asks two different ingredients.");
  }

  const first = ingredientProblem(state, firstId, recipe.first.rarity, recipe.first.quantity);
  if ("failureMessage" in first) return failure(state, first.failureMessage);
  const second = ingredientProblem(state, secondId, recipe.second.rarity, recipe.second.quantity);
  if ("failureMessage" in second) return failure(state, second.failureMessage);

  if (countInInventory(state.inventory, EMPTY_FLASK_ID, 0) < 1) {
    return failure(state, "No empty flask in the bag: the market sells them.");
  }

  const scrollId = scrollIdFor(potionId);
  if (countInInventory(state.inventory, scrollId, 0) < 1) {
    return failure(state, "No scroll for this potion: the market sells them.");
  }

  let inventory = removeFromInventory(state.inventory, EMPTY_FLASK_ID, 1, 0);
  inventory = removeFromInventory(inventory, scrollId, 1, 0);
  inventory = removeFromInventory(inventory, firstId, recipe.first.quantity, 0);
  inventory = removeFromInventory(inventory, secondId, recipe.second.quantity, 0);
  inventory = addToInventory(inventory, potionId, 1, 0);

  const climbed = applyAlchemyProgress(state.alchemy, alchemyEffort(state.alchemy.level));
  const next: GameState = { ...state, inventory, alchemy: climbed.alchemy };
  const message =
    potion.name +
    " brewed: " +
    first.item.name +
    " x" +
    recipe.first.quantity +
    ", " +
    second.item.name +
    " x" +
    recipe.second.quantity +
    ", one scroll and one empty flask spent." +
    (climbed.levelsGained > 0 ? " Alchemy reached LV. " + climbed.alchemy.level + "." : "");
  return success(addLog(next, "inventory", message), message);
}
