import { formatBronze } from "@/shared/utils/format";
import { isValidQuantity } from "@/shared/utils/quantity";
import { findItem, lineageName, marketItems, servesLineage } from "@/models/data/items";
import type { GameState } from "@/models/entities/game-state";
import { EQUIPMENT_SLOTS, type EquipmentSlot, type Item } from "@/models/entities/item";
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

export function sellPrice(item: Item): number {
  return Math.max(1, Math.round(item.price * SELL_RATIO));
}

export interface MarketOffer {
  item: Item;
  levelAllowed: boolean;
  affordable: boolean;
  ofLineage: boolean;
  ownedQuantity: number;
  alreadyOwned: boolean;
  reason: string | null;
}

function ownsWearable(state: GameState, item: Item): boolean {
  if (!(EQUIPMENT_SLOTS as readonly string[]).includes(item.category)) return false;
  if (state.equipment[item.category as EquipmentSlot] === item.id) return true;
  return countInInventory(state.inventory, item.id) > 0;
}

export function listOffers(state: GameState): MarketOffer[] {
  const character = state.character;

  return marketItems()
    .map((item) => {
      const levelAllowed = character !== null && character.level >= item.minLevel;
      const affordable = character !== null && character.bronze >= item.price;
      const ofLineage = character !== null && servesLineage(item, character.gender);
      const alreadyOwned = ownsWearable(state, item);

      return {
        item,
        levelAllowed,
        affordable,
        ofLineage,
        ownedQuantity: countInInventory(state.inventory, item.id),
        alreadyOwned,
        reason: !ofLineage
          ? "Apenas " + lineageName(item)
          : !levelAllowed
            ? "Requer NV. " + item.minLevel
            : alreadyOwned
              ? "Uma peça basta: a forja sobe na bigorna"
              : !affordable
                ? "Bronze insuficiente"
                : null,
      };
    })
    .sort((a, b) => a.item.price - b.item.price);
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
  if ((EQUIPMENT_SLOTS as readonly string[]).includes(item.category) && quantity > 1) {
    return failure(state, item.name + " se compra uma por vez: uma peça basta.");
  }
  if (ownsWearable(state, item)) {
    return failure(state, item.name + " já é do seu corpo: uma peça basta.");
  }

  const cost = item.price * quantity;
  if (character.bronze < cost) return failure(state, "Bronze insuficiente para " + item.name + ".");

  const next: GameState = {
    ...state,
    character: { ...character, bronze: character.bronze - cost },
    inventory: addToInventory(state.inventory, itemId, quantity),
  };

  const message = item.name + " comprado por " + formatBronze(cost) + ".";
  return success(addLog(next, "market", message), message);
}

export function sellItem(state: GameState, itemId: string, quantity = 1): Result {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const item = findItem(itemId);
  if (!item) return failure(state, "Item desconhecido.");
  if (!isValidQuantity(quantity)) return failure(state, "Quantidade inválida.");
  if (isForgeMaterial(item)) {
    return failure(state, "Fragmentos não se vendem por bronze: só a forja os aceita.");
  }
  if (countInInventory(state.inventory, itemId) < quantity) {
    return failure(state, "Você não tem essa quantidade de " + item.name + ".");
  }

  const gain = sellPrice(item) * quantity;
  const next: GameState = {
    ...state,
    character: { ...character, bronze: character.bronze + gain },
    inventory: removeFromInventory(state.inventory, itemId, quantity),
  };

  const message = item.name + " vendido por " + formatBronze(gain) + ".";
  return success(addLog(next, "market", message), message);
}
