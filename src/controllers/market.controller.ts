import { capBronze, formatBronze } from "@/shared/utils/format";
import { isValidQuantity } from "@/shared/utils/quantity";
import { findItem, lineageName, marketItems, servesLineage } from "@/models/data/items";
import { huntPurse } from "@/models/data/species";
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

export function sellPrice(item: Item, level: number): number {
  return Math.max(1, Math.round(marketPriceOf(item, level) * SELL_RATIO));
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
          ? "Apenas " + lineageName(item)
          : !levelAllowed
            ? "Requer NV. " + item.minLevel
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
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const item = findItem(itemId);
  if (!item) return failure(state, "Item desconhecido.");
  if (!item.inMarket) return failure(state, item.name + " não é vendido aqui.");
  if (!isValidQuantity(quantity)) return failure(state, "Quantidade inválida.");
  if (!servesLineage(item, character.gender)) {
    return failure(state, item.name + " é peça de " + lineageName(item) + ".");
  }
  if (character.level < item.minLevel) {
    return failure(state, item.name + " exige NV. " + item.minLevel + ".");
  }
  if (item.category === "pet" && !state.pet) {
    return failure(state, "Sem mascote para alimentar: adote um lobo antes.");
  }

  const cost = marketPriceOf(item, character.level) * quantity;
  if (character.bronze < cost) return failure(state, "WCoins insuficientes para " + item.name + ".");

  const next: GameState = {
    ...state,
    character: { ...character, bronze: character.bronze - cost },
    inventory: addToInventory(state.inventory, itemId, quantity, 0),
  };

  const message =
    item.name + (quantity > 1 ? " x" + quantity : "") + " comprado por " + formatBronze(cost) + ".";
  return success(addLog(next, "market", message), message);
}

export function sellItem(
  state: GameState,
  itemId: string,
  quantity = 1,
  enhancement = 0,
): Result {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const item = findItem(itemId);
  if (!item) return failure(state, "Item desconhecido.");
  if (!isValidQuantity(quantity)) return failure(state, "Quantidade inválida.");
  if (isForgeMaterial(item)) {
    return failure(state, "Fragmentos não se vendem por bronze: só a forja os aceita.");
  }
  if (enhancement > 0) {
    return failure(state, item.name + " está forjado: peças forjadas só se vendem no bazar.");
  }
  if (countInInventory(state.inventory, itemId, enhancement) < quantity) {
    return failure(state, "Você não tem essa quantidade de " + item.name + ".");
  }

  const gain = sellPrice(item, character.level) * quantity;
  const next: GameState = {
    ...state,
    character: { ...character, bronze: capBronze(character.bronze + gain) },
    inventory: removeFromInventory(state.inventory, itemId, quantity, enhancement),
  };

  const message = item.name + " vendido por " + formatBronze(gain) + ".";
  return success(addLog(next, "market", message), message);
}
