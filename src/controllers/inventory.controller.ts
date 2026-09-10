import { findItem, lineageName, servesLineage } from "@/models/data/items";
import { gearChangeBlockReason, type Activity } from "@/models/entities/activity";
import type { GameState } from "@/models/entities/game-state";
import {
  isEquippable,
  SLOT_LABEL,
  type EquipmentSlot,
  type Item,
  type InventorySlot,
} from "@/models/entities/item";
import { failure, success, type Result } from "@/models/entities/result";
import { furyDurationMs, furyWillpowerExtraMs, isFullMoon } from "@/models/rules/moon";
import { rollHealthPotionHeal } from "@/models/rules/potion";
import { deriveStats } from "@/models/rules/stats";
import { FURY_MOON_ATTRIBUTE_BONUS } from "@/shared/constants/game";
import { formatFuryDuration } from "@/shared/utils/format";
import { defaultRandom, type Random } from "@/shared/utils/random";
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

// The activity is handed in for the same reason it is handed to `unequipItem`
// below: the job slot never lived in GameState, so the route reads it from its
// own table inside the transaction it already locked.
export function equipItem(
  state: GameState,
  itemId: string,
  enhancement = 0,
  activity?: Activity | null,
): Result {
  const busy = gearChangeBlockReason(activity);
  if (busy) return failure(state, busy);

  const character = state.character;
  if (!character) return failure(state, "No active character.");

  const item = findItem(itemId);
  if (!item) return failure(state, "Unknown item.");
  if (!isEquippable(item)) return failure(state, item.name + " cannot be equipped.");
  if (countInInventory(state.inventory, itemId, enhancement) <= 0) {
    return failure(state, enhancedName(item.name, enhancement) + " is not in the bag.");
  }
  if (!servesLineage(item, character.gender)) {
    return failure(state, item.name + " is a piece for " + lineageName(item) + ".");
  }
  if (character.level < item.minLevel) {
    return failure(state, item.name + " demands LV. " + item.minLevel + ".");
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
    enhancedName(item.name, enhancement) + " equipped on the " + SLOT_LABEL[slot].toLowerCase() + ".";
  return success(addLog(syncCharacter(next), "inventory", message), message);
}

// The other half of the closed body. A caller with nothing to hand in, the
// audit bench and a read-only derivation, keeps the old behaviour.
export function unequipItem(
  state: GameState,
  slot: EquipmentSlot,
  activity?: Activity | null,
): Result {
  const busy = gearChangeBlockReason(activity);
  if (busy) return failure(state, busy);

  const piece = state.equipment[slot];
  if (!piece) return failure(state, "Nothing equipped on the " + SLOT_LABEL[slot].toLowerCase() + ".");

  const item = findItem(piece.itemId);
  const next: GameState = {
    ...state,
    inventory: addToInventory(state.inventory, piece.itemId, 1, piece.enhancement),
    equipment: { ...state.equipment, [slot]: null },
  };

  const message =
    enhancedName(item?.name ?? "Item", piece.enhancement) + " stored in the bag.";
  return success(addLog(syncCharacter(next), "inventory", message), message);
}

export function consumeItem(
  state: GameState,
  itemId: string,
  random: Random = defaultRandom,
): Result {
  const character = state.character;
  if (!character) return failure(state, "No active character.");

  const item = findItem(itemId);
  if (!item) return failure(state, "Unknown item.");
  if (item.category === "pet") return feedPet(state, itemId);
  if (item.category !== "potion") return failure(state, item.name + " is not consumable.");
  if (countInInventory(state.inventory, itemId) <= 0) {
    return failure(state, item.name + " is not in the bag.");
  }

  const furyMinutes = item.effect.furyMinutes ?? 0;
  if (furyMinutes > 0) {
    if (isFullMoon()) {
      return failure(state, "The full moon already keeps you in fury.");
    }
    const derived = deriveStats(character, state.equipment, state.pet);
    const willpower = derived.totalAttributes.willpower - derived.sources.fury.willpower;
    const lastingMs = furyDurationMs(furyMinutes, willpower);
    const until = new Date(Date.now() + lastingMs).toISOString();
    // The flask says how deep it goes; the character carries that number for as
    // long as the clock runs, so a small glass never lends a large one's fury.
    const furyBonus = item.effect.furyBonus ?? FURY_MOON_ATTRIBUTE_BONUS;
    const consumed: GameState = {
      ...state,
      inventory: removeFromInventory(state.inventory, itemId, 1),
    };
    const next = updateCharacter(consumed, (current) => ({
      ...current,
      furyUntil: until,
      furyBonus,
    }));
    const message =
      item.name +
      " consumed: +" +
      furyBonus +
      " to all attributes for " +
      formatFuryDuration(furyMinutes, furyWillpowerExtraMs(willpower)) +
      ".";
    return success(addLog(syncCharacter(next), "inventory", message), message);
  }

  const stats = deriveStats(character, state.equipment, state.pet);
  const healthGain = rollHealthPotionHeal(item, random);

  if (healthGain <= 0 || character.health >= stats.maxHealth) {
    return failure(state, "Nothing to restore with " + item.name + " right now.");
  }

  const consumed: GameState = {
    ...state,
    inventory: removeFromInventory(state.inventory, itemId, 1),
  };

  const healed = Math.min(healthGain, stats.maxHealth - character.health);
  const next = updateCharacter(consumed, (current) => ({
    ...current,
    health: current.health + healed,
  }));

  const message = item.name + " consumed: +" + healed + " health.";
  return success(addLog(syncCharacter(next), "inventory", message), message);
}
