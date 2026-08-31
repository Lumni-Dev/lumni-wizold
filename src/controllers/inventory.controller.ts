import { findItem, lineageName, servesLineage } from "@/models/data/items";
import type { GameState } from "@/models/entities/game-state";
import {
  isEquippable,
  SLOT_LABEL,
  type EquipmentSlot,
  type Item,
  type InventorySlot,
} from "@/models/entities/item";
import { failure, success, type Result } from "@/models/entities/result";
import { deriveStats } from "@/models/rules/stats";
import { syncCharacter, updateCharacter } from "./character.controller";
import { enhancedName } from "@/models/rules/forge";
import { addLog } from "./log.controller";
import { feedPet } from "./pet.controller";

export function addToInventory(
  inventory: readonly InventorySlot[],
  itemId: string,
  quantity = 1,
  enhancement = 0,
): InventorySlot[] {
  const item = findItem(itemId);
  if (!item || quantity <= 0) return [...inventory];

  const existing = inventory.find(
    (slot) => slot.itemId === itemId && slot.enhancement === enhancement,
  );
  if (!existing) return [...inventory, { itemId, quantity, enhancement }];

  return inventory.map((slot) =>
    slot.itemId === itemId && slot.enhancement === enhancement
      ? { ...slot, quantity: slot.quantity + quantity }
      : slot,
  );
}

export function removeFromInventory(
  inventory: readonly InventorySlot[],
  itemId: string,
  quantity = 1,
  enhancement = 0,
): InventorySlot[] {
  let remaining = quantity;
  const result: InventorySlot[] = [];

  for (const slot of inventory) {
    if (slot.itemId !== itemId || slot.enhancement !== enhancement || remaining <= 0) {
      result.push({ ...slot });
      continue;
    }
    const taken = Math.min(slot.quantity, remaining);
    remaining -= taken;
    if (slot.quantity - taken > 0) {
      result.push({ ...slot, quantity: slot.quantity - taken });
    }
  }

  return result;
}

export function countInInventory(
  inventory: readonly InventorySlot[],
  itemId: string,
  enhancement?: number,
): number {
  return inventory
    .filter(
      (slot) =>
        slot.itemId === itemId && (enhancement === undefined || slot.enhancement === enhancement),
    )
    .reduce((total, slot) => total + slot.quantity, 0);
}

export interface DetailedSlot {
  item: Item;
  quantity: number;
  enhancement: number;
}

export function detailInventory(state: GameState): DetailedSlot[] {
  const grouped = new Map<string, { itemId: string; enhancement: number; quantity: number }>();
  for (const slot of state.inventory) {
    const key = slot.itemId + "@" + slot.enhancement;
    const entry = grouped.get(key);
    if (entry) {
      entry.quantity += slot.quantity;
    } else {
      grouped.set(key, {
        itemId: slot.itemId,
        enhancement: slot.enhancement,
        quantity: slot.quantity,
      });
    }
  }

  return Array.from(grouped.values())
    .map((entry) => ({
      item: findItem(entry.itemId),
      quantity: entry.quantity,
      enhancement: entry.enhancement,
    }))
    .filter((slot): slot is DetailedSlot => Boolean(slot.item))
    .sort(
      (a, b) =>
        a.item.name.localeCompare(b.item.name, "pt-BR") || a.enhancement - b.enhancement,
    );
}

export function gainItems(
  state: GameState,
  items: readonly { itemId: string; quantity: number }[],
): GameState {
  return items.reduce(
    (current, gain) => ({
      ...current,
      inventory: addToInventory(current.inventory, gain.itemId, gain.quantity),
    }),
    state,
  );
}

export function equipItem(state: GameState, itemId: string, enhancement = 0): Result {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const item = findItem(itemId);
  if (!item) return failure(state, "Item desconhecido.");
  if (!isEquippable(item)) return failure(state, item.name + " não pode ser equipado.");
  if (countInInventory(state.inventory, itemId, enhancement) <= 0) {
    return failure(state, enhancedName(item.name, enhancement) + " não está no inventário.");
  }
  if (!servesLineage(item, character.gender)) {
    return failure(state, item.name + " é peça de " + lineageName(item) + ".");
  }
  if (character.level < item.minLevel) {
    return failure(state, item.name + " exige NV. " + item.minLevel + ".");
  }

  const slot = item.category as EquipmentSlot;
  const previous = state.equipment[slot];

  let next: GameState = {
    ...state,
    inventory: removeFromInventory(state.inventory, itemId, 1, enhancement),
    equipment: { ...state.equipment, [slot]: { itemId, enhancement } },
  };

  if (previous) {
    next = {
      ...next,
      inventory: addToInventory(next.inventory, previous.itemId, 1, previous.enhancement),
    };
  }

  const message =
    enhancedName(item.name, enhancement) + " equipado em " + SLOT_LABEL[slot].toLowerCase() + ".";
  return success(addLog(syncCharacter(next), "inventory", message), message);
}

export function unequipItem(state: GameState, slot: EquipmentSlot): Result {
  const piece = state.equipment[slot];
  if (!piece) return failure(state, "Nada equipado em " + SLOT_LABEL[slot].toLowerCase() + ".");

  const item = findItem(piece.itemId);
  const next: GameState = {
    ...state,
    inventory: addToInventory(state.inventory, piece.itemId, 1, piece.enhancement),
    equipment: { ...state.equipment, [slot]: null },
  };

  const message =
    enhancedName(item?.name ?? "Item", piece.enhancement) + " guardado no inventário.";
  return success(addLog(syncCharacter(next), "inventory", message), message);
}

export function consumeItem(state: GameState, itemId: string): Result {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const item = findItem(itemId);
  if (!item) return failure(state, "Item desconhecido.");
  if (item.category === "pet") return feedPet(state, itemId);
  if (item.category !== "potion") return failure(state, item.name + " não é consumível.");
  if (countInInventory(state.inventory, itemId) <= 0) {
    return failure(state, item.name + " não está no inventário.");
  }

  const furyMinutes = item.effect.furyMinutes ?? 0;
  if (furyMinutes > 0) {
    if (character.furyUntil && Date.now() < Date.parse(character.furyUntil)) {
      return failure(state, "Você já está em fúria: espere ela passar para beber de novo.");
    }
    const until = new Date(Date.now() + furyMinutes * 60_000).toISOString();
    const consumed: GameState = {
      ...state,
      inventory: removeFromInventory(state.inventory, itemId, 1),
    };
    const next = updateCharacter(consumed, (current) => ({ ...current, furyUntil: until }));
    const message =
      item.name +
      " consumida: +10 em todos os atributos por " +
      String(furyMinutes).replace(".", ",") +
      " min.";
    return success(addLog(next, "inventory", message), message);
  }

  const stats = deriveStats(character, state.equipment, state.pet);
  const healthGain =
    (item.effect.health ?? 0) + Math.round((item.effect.healthRatio ?? 0) * stats.maxHealth);

  if (healthGain <= 0 || character.health >= stats.maxHealth) {
    return failure(state, "Nada a recuperar com " + item.name + " agora.");
  }

  const consumed: GameState = {
    ...state,
    inventory: removeFromInventory(state.inventory, itemId, 1),
  };

  const next = updateCharacter(consumed, (current) => ({
    ...current,
    health: current.health + healthGain,
  }));

  const message = item.name + " consumida.";
  return success(addLog(next, "inventory", message), message);
}
