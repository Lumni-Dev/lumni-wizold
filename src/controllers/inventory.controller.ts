import { isValidQuantity } from "@/shared/utils/quantity";
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
import { enhancementOf } from "@/models/rules/forge";
import { addLog } from "./log.controller";
import { feedPet } from "./pet.controller";

export function addToInventory(
  inventory: readonly InventorySlot[],
  itemId: string,
  quantity = 1,
): InventorySlot[] {
  const item = findItem(itemId);
  if (!item || quantity <= 0) return [...inventory];

  if (!item.stackable) {
    const slots: InventorySlot[] = [...inventory];
    for (let index = 0; index < quantity; index += 1) {
      slots.push({ itemId, quantity: 1 });
    }
    return slots;
  }

  const existing = inventory.find((slot) => slot.itemId === itemId);
  if (!existing) return [...inventory, { itemId, quantity }];

  return inventory.map((slot) =>
    slot.itemId === itemId ? { ...slot, quantity: slot.quantity + quantity } : slot,
  );
}

export function removeFromInventory(
  inventory: readonly InventorySlot[],
  itemId: string,
  quantity = 1,
): InventorySlot[] {
  let remaining = quantity;
  const result: InventorySlot[] = [];

  for (const slot of inventory) {
    if (slot.itemId !== itemId || remaining <= 0) {
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

export function countInInventory(inventory: readonly InventorySlot[], itemId: string): number {
  return inventory
    .filter((slot) => slot.itemId === itemId)
    .reduce((total, slot) => total + slot.quantity, 0);
}

export interface DetailedSlot {
  item: Item;
  quantity: number;
  enhancement: number;
}

export function detailInventory(state: GameState): DetailedSlot[] {
  const grouped = new Map<string, number>();
  for (const slot of state.inventory) {
    grouped.set(slot.itemId, (grouped.get(slot.itemId) ?? 0) + slot.quantity);
  }

  return Array.from(grouped.entries())
    .map(([itemId, quantity]) => ({
      item: findItem(itemId),
      quantity,
      enhancement: enhancementOf(state.enhancements, itemId),
    }))
    .filter((slot): slot is DetailedSlot => Boolean(slot.item))
    .sort((a, b) => a.item.name.localeCompare(b.item.name, "pt-BR"));
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

export function equipItem(state: GameState, itemId: string): Result {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const item = findItem(itemId);
  if (!item) return failure(state, "Item desconhecido.");
  if (!isEquippable(item)) return failure(state, item.name + " não pode ser equipado.");
  if (countInInventory(state.inventory, itemId) <= 0) {
    return failure(state, item.name + " não está no inventário.");
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
    inventory: removeFromInventory(state.inventory, itemId, 1),
    equipment: { ...state.equipment, [slot]: itemId },
  };

  if (previous) {
    next = { ...next, inventory: addToInventory(next.inventory, previous, 1) };
  }

  const message = item.name + " equipado em " + SLOT_LABEL[slot].toLowerCase() + ".";
  return success(addLog(syncCharacter(next), "inventory", message), message);
}

export function unequipItem(state: GameState, slot: EquipmentSlot): Result {
  const itemId = state.equipment[slot];
  if (!itemId) return failure(state, "Nada equipado em " + SLOT_LABEL[slot].toLowerCase() + ".");

  const item = findItem(itemId);
  const next: GameState = {
    ...state,
    inventory: addToInventory(state.inventory, itemId, 1),
    equipment: { ...state.equipment, [slot]: null },
  };

  const message = (item?.name ?? "Item") + " guardado no inventário.";
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

  const stats = deriveStats(character, state.equipment, state.pet, state.enhancements);
  const healthGain =
    (item.effect.health ?? 0) + Math.round((item.effect.healthRatio ?? 0) * stats.maxHealth);
  const rageGain =
    (item.effect.rage ?? 0) + Math.round((item.effect.rageRatio ?? 0) * stats.maxRage);

  const healsHealth = healthGain > 0 && character.health < stats.maxHealth;
  const healsRage = rageGain > 0 && character.rage < stats.maxRage;

  if (!healsHealth && !healsRage) {
    return failure(state, "Nada a recuperar com " + item.name + " agora.");
  }

  const consumed: GameState = {
    ...state,
    inventory: removeFromInventory(state.inventory, itemId, 1),
  };

  const next = updateCharacter(consumed, (current) => ({
    ...current,
    health: current.health + healthGain,
    rage: current.rage + rageGain,
  }));

  const message = item.name + " consumida.";
  return success(addLog(next, "inventory", message), message);
}

export function discardItem(state: GameState, itemId: string, quantity = 1): Result {
  const item = findItem(itemId);
  if (!item) return failure(state, "Item desconhecido.");
  if (!isValidQuantity(quantity)) return failure(state, "Quantidade inválida.");
  if (countInInventory(state.inventory, itemId) < quantity) {
    return failure(state, "Quantidade indisponível de " + item.name + ".");
  }

  const next: GameState = {
    ...state,
    inventory: removeFromInventory(state.inventory, itemId, quantity),
  };

  const message = item.name + " descartado.";
  return success(addLog(next, "inventory", message), message);
}
