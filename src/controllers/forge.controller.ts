import { FORGE_SUCCESS_RATIO, MAX_ENHANCEMENT } from "@/shared/constants/game";
import { chance, defaultRandom, intBetween, type Random } from "@/shared/utils/random";
import { ATTRIBUTES, type AttributeKey } from "@/models/entities/attribute";
import { findItem } from "@/models/data/items";
import type { GameState } from "@/models/entities/game-state";
import { EQUIPMENT_SLOTS, type EquipmentSlot, type Item } from "@/models/entities/item";
import { findOre, MINING_MAX_LEVEL, ORES, type Ore } from "@/models/entities/mining";
import { failure, success, type Result } from "@/models/entities/result";
import { enhancementCost, enhancementOf, enhancedEffect } from "@/models/rules/forge";
import { applyMiningProgress, miningNeeded, miningYieldBonus } from "@/models/rules/mining";
import { addToInventory, countInInventory, removeFromInventory } from "./inventory.controller";
import { addLog } from "./log.controller";

export interface AvailableOre {
  ore: Ore;
  fragment: Item;
  owned: number;
  unlocked: boolean;
  reason: string | null;
}

export interface MiningView {
  level: number;
  progress: number;
  needed: number;
  maxed: boolean;
  ores: AvailableOre[];
}

export function listMining(state: GameState): MiningView {
  const mining = state.mining;

  const ores = ORES.map((ore) => {
    const unlocked = mining.level >= ore.requiredLevel;

    return {
      ore,
      fragment: findItem(ore.fragmentId) as Item,
      owned: countInInventory(state.inventory, ore.fragmentId),
      unlocked,
      reason: !unlocked ? "Requer mineração NV. " + ore.requiredLevel : null,
    };
  });

  const maxed = mining.level >= MINING_MAX_LEVEL;
  const needed = miningNeeded(mining.level);

  return {
    level: mining.level,
    progress: maxed ? needed : mining.progress,
    needed,
    maxed,
    ores,
  };
}

export function mine(
  state: GameState,
  oreId: string,
  random: Random = defaultRandom,
): Result<{ levelsGained: number }> {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const ore = findOre(oreId);
  if (!ore) return failure(state, "Veio desconhecido.");
  if (state.mining.level < ore.requiredLevel) {
    return failure(state, ore.label + " exige mineração NV. " + ore.requiredLevel + ".");
  }

  const yielded =
    intBetween(ore.minYield, ore.maxYield, random) * miningYieldBonus(state.mining.level);
  const { mining, levelsGained } = applyMiningProgress(state.mining, ore.progress);

  const next: GameState = {
    ...state,
    mining,
    inventory: addToInventory(state.inventory, ore.fragmentId, yielded),
  };

  const fragment = findItem(ore.fragmentId);
  const message =
    levelsGained > 0
      ? yielded +
        " de " +
        (fragment?.name ?? "fragmento") +
        ". A mineração subiu para " +
        mining.level +
        "."
      : yielded + " de " + (fragment?.name ?? "fragmento") + " sai da rocha.";

  return success(addLog(next, "system", message), message, { levelsGained });
}

export interface ForgeSlot {
  slot: EquipmentSlot;
  item: Item | null;
  level: number;
  fragment: Item | null;
  cost: number;
  owned: number;
  canForge: boolean;
  reason: string | null;
  attributes: { key: AttributeKey; name: string; value: number; nextValue: number }[];
}

function fragmentOf(item: Item): Item | null {
  return item.set ? (findItem(item.set + "-fragment") ?? null) : null;
}

export function listForge(state: GameState): ForgeSlot[] {
  return EQUIPMENT_SLOTS.map((slot) => {
    const itemId = state.equipment[slot];
    const item = itemId ? (findItem(itemId) ?? null) : null;
    const level = itemId ? enhancementOf(state.enhancements, itemId) : 0;

    if (!item) {
      return {
        slot,
        item: null,
        level: 0,
        fragment: null,
        cost: 0,
        owned: 0,
        canForge: false,
        reason: null,
        attributes: [],
      };
    }

    const fragment = fragmentOf(item);
    const cost = enhancementCost(level + 1);
    const owned = fragment ? countInInventory(state.inventory, fragment.id) : 0;
    const maxed = level >= MAX_ENHANCEMENT;

    const current = enhancedEffect(item, level);
    const next = enhancedEffect(item, level + 1);

    return {
      slot,
      item,
      level,
      fragment,
      cost,
      owned,
      canForge: Boolean(fragment) && !maxed && owned >= cost,
      reason: maxed
        ? "No teto de +" + MAX_ENHANCEMENT
        : !fragment
          ? "Esta peça não tem fragmento"
          : null,
      attributes: ATTRIBUTES.filter(
        (definition) => (current.attributes?.[definition.key] ?? 0) > 0,
      ).map((definition) => ({
        key: definition.key,
        name: definition.name,
        value: current.attributes?.[definition.key] ?? 0,
        nextValue: next.attributes?.[definition.key] ?? 0,
      })),
    };
  });
}

export function enhance(
  state: GameState,
  slot: EquipmentSlot,
  random: Random = defaultRandom,
): Result<{ raised: boolean }> {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const itemId = state.equipment[slot];
  if (!itemId) return failure(state, "Nada equipado nesse espaço.");

  const item = findItem(itemId);
  if (!item) return failure(state, "Item desconhecido.");

  const level = enhancementOf(state.enhancements, itemId);
  if (level >= MAX_ENHANCEMENT) {
    return failure(state, item.name + " já está no teto de +" + MAX_ENHANCEMENT + ".");
  }

  const fragment = fragmentOf(item);
  if (!fragment) return failure(state, item.name + " não aceita forja.");

  const cost = enhancementCost(level + 1);
  const owned = countInInventory(state.inventory, fragment.id);
  if (owned < cost) {
    return failure(
      state,
      "Faltam " + (cost - owned) + " " + fragment.name + " para o próximo nível.",
    );
  }

  const struck = chance(FORGE_SUCCESS_RATIO, random);
  const next: GameState = {
    ...state,
    inventory: removeFromInventory(state.inventory, fragment.id, cost),
    enhancements: struck ? { ...state.enhancements, [itemId]: level + 1 } : state.enhancements,
  };

  const message = struck
    ? item.name + " sai da bigorna em +" + (level + 1) + "."
    : "A martelada falha e os fragmentos se perdem: " +
      item.name +
      (level > 0 ? " segue em +" + level + "." : " segue como estava.");
  return success(addLog(next, "system", message), message, { raised: struck });
}
