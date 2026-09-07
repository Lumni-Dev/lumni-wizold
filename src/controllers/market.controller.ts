import { capBronze, formatBronze } from "@/shared/utils/format";
import { isValidQuantity } from "@/shared/utils/quantity";
import { findItem, lineageName, marketItems, servesLineage } from "@/models/data/items";
import { huntPurse } from "@/models/rules/economy";
import type { GameState } from "@/models/entities/game-state";
import { type Item } from "@/models/entities/item";
import { failure, success, type Result } from "@/models/entities/result";
import { isForgeMaterial } from "@/models/rules/bazaar";
import {
  addToInventory,
  countInInventory,
  detailInventory,
  removeFromInventory,
  type DetailedSlot,
} from "./inventory.controller";
import { addLog } from "./log.controller";

const SELL_RATIO = 0.5;

export function marketPriceOf(item: Item, level: number): number {
  if (item.huntCost === undefined) return item.price;
  return Math.max(1, Math.round(huntPurse(level) * item.huntCost));
}

export const DROP_SELL_BONUS = 5;

export function sellPrice(item: Item, level: number): number {
  const base = Math.max(1, Math.round(marketPriceOf(item, level) * SELL_RATIO));
  if (item.category === "material" && !isForgeMaterial(item)) return base + DROP_SELL_BONUS;
  return base;
}

export interface MarketOffer {
  item: Item;
  price: number;
  levelAllowed: boolean;
  affordable: boolean;
  ofLineage: boolean;
  ownedQuantity: number;
  reason: string | null;
}

export function listOffers(state: GameState): MarketOffer[] {
  const character = state.character;

  const level = character?.level ?? 1;

  return marketItems()
    .map((item) => {
      const price = marketPriceOf(item, level);
      const levelAllowed = character !== null && character.level >= item.minLevel;
      const affordable = character !== null && character.bronze >= price;
      const ofLineage = character !== null && servesLineage(item, character.gender);

      return {
        item,
        price,
        levelAllowed,
        affordable,
        ofLineage,
        ownedQuantity: countInInventory(state.inventory, item.id, 0),
        reason: !ofLineage
          ? "Only " + lineageName(item)
          : !levelAllowed
            ? "Requires LV. " + item.minLevel
            : !affordable
              ? "WCoins insuficientes"
              : null,
      };
    })
    .sort((a, b) => a.price - b.price);
}

export function listSellables(state: GameState): DetailedSlot[] {
  return detailInventory(state).filter(({ item }) => !isForgeMaterial(item));
}

export function buyItem(state: GameState, itemId: string, quantity = 1): Result {
  const character = state.character;
  if (!character) return failure(state, "No active character.");

  const item = findItem(itemId);
  if (!item) return failure(state, "Unknown item.");
  if (!item.inMarket) return failure(state, item.name + " is not sold here.");
  if (!isValidQuantity(quantity)) return failure(state, "Invalid quantity.");
  if (!servesLineage(item, character.gender)) {
    return failure(state, item.name + " is a piece for " + lineageName(item) + ".");
  }
  if (character.level < item.minLevel) {
    return failure(state, item.name + " demands LV. " + item.minLevel + ".");
  }
  if (item.category === "pet" && !state.pet) {
    return failure(state, "No companion to feed: adopt a wolf first.");
  }

  const cost = marketPriceOf(item, character.level) * quantity;
  if (character.bronze < cost) return failure(state, "Not enough WCoins for " + item.name + ".");

  const next: GameState = {
    ...state,
    character: { ...character, bronze: character.bronze - cost },
    inventory: addToInventory(state.inventory, itemId, quantity, 0),
  };

  const message =
    item.name + (quantity > 1 ? " x" + quantity : "") + " bought for " + formatBronze(cost) + ".";
  return success(addLog(next, "market", message), message);
}

export function sellItem(
  state: GameState,
  itemId: string,
  quantity = 1,
  enhancement = 0,
): Result {
  const character = state.character;
  if (!character) return failure(state, "No active character.");

  const item = findItem(itemId);
  if (!item) return failure(state, "Unknown item.");
  if (!isValidQuantity(quantity)) return failure(state, "Invalid quantity.");
  if (isForgeMaterial(item)) {
    return failure(state, "Fragments do not sell for WCoins: only the forge takes them.");
  }
  if (countInInventory(state.inventory, itemId, enhancement) < quantity) {
    return failure(state, "You do not have that many " + item.name + ".");
  }

  const gain = sellPrice(item, character.level) * quantity;
  const next: GameState = {
    ...state,
    character: { ...character, bronze: capBronze(character.bronze + gain) },
    inventory: removeFromInventory(state.inventory, itemId, quantity, enhancement),
  };

  const message = item.name + " sold for " + formatBronze(gain) + ".";
  return success(addLog(next, "market", message), message);
}
