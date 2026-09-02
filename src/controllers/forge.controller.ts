import {
  FORGE_SUCCESS_RATIO,
  MAX_ENHANCEMENT,
  MINING_DAILY_MININGS,
} from "@/shared/constants/game";
import { chance, defaultRandom, intBetween, type Random } from "@/shared/utils/random";
import { ATTRIBUTES, type AttributeKey } from "@/models/entities/attribute";
import { findItem } from "@/models/data/items";
import type { GameState } from "@/models/entities/game-state";
import { EQUIPMENT_SLOTS, isEquippable, type EquipmentSlot, type Item } from "@/models/entities/item";
import { type MiningState, type Ore } from "@/models/entities/mining";
import { findOre, MINING_MAX_LEVEL, ORES } from "@/models/data/ores";
import { failure, success, type Result } from "@/models/entities/result";
import { formatBronze, formatCooldown } from "@/shared/utils/format";
import {
  enhancementCost,
  enhancedEffect,
  enhancedName,
  forgeBronzeCost,
} from "@/models/rules/forge";
import {
  applyMiningProgress,
  miningEffort,
  miningExhausted,
  miningNeeded,
  miningRemaining,
  miningResetsInMs,
  rolloverMining,
} from "@/models/rules/mining";
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
  dailyRemaining: number;
  dailyLimit: number;
  dailyExhausted: boolean;
  dailyResetsInMs: number;
}

export function listMining(state: GameState, now: number = Date.now()): MiningView {
  const mining = state.mining;
  const dailyRemaining = miningRemaining(mining, now);
  const dailyExhausted = miningExhausted(mining, now);

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
    dailyRemaining,
    dailyLimit: MINING_DAILY_MININGS,
    dailyExhausted,
    dailyResetsInMs: miningResetsInMs(now),
  };
}

export function mine(
  state: GameState,
  oreId: string,
  random: Random = defaultRandom,
  now: number = Date.now(),
): Result<{ levelsGained: number }> {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const ore = findOre(oreId);
  if (!ore) return failure(state, "Veio desconhecido.");
  if (state.mining.level < ore.requiredLevel) {
    return failure(state, ore.label + " exige mineração NV. " + ore.requiredLevel + ".");
  }

  const rolled = rolloverMining(state.mining, now);
  if (rolled.count >= MINING_DAILY_MININGS) {
    return failure(
      state,
      "Você já minerou o limite de hoje. A veia reabre em " + formatCooldown(miningResetsInMs(now)) + ".",
    );
  }

  const yielded = intBetween(ore.minYield, ore.maxYield, random);
  const effort = miningEffort(rolled.level);
  const { mining: advanced, levelsGained } = applyMiningProgress(rolled, effort);
  const mining: MiningState = {
    ...advanced,
    windowStart: rolled.windowStart ?? new Date(now).toISOString(),
    count: rolled.count + 1,
  };

  const next: GameState = {
    ...state,
    mining,
    inventory: addToInventory(state.inventory, ore.fragmentId, yielded),
  };

  const fragment = findItem(ore.fragmentId);
  const atCeiling = rolled.level >= MINING_MAX_LEVEL;
  const haul =
    yielded +
    " de " +
    (fragment?.name ?? "fragmento") +
    (atCeiling ? "" : " e " + effort + " de experiência de mineração");
  const message =
    levelsGained > 0
      ? haul + ". A mineração subiu para " + mining.level + "."
      : haul + (atCeiling ? " sai da rocha." : " saem da rocha.");

  return success(addLog(next, "system", message), message, { levelsGained });
}

export interface ForgePiece {
  item: Item;
  level: number;
  quantity: number;
  fragment: Item | null;
  cost: number;
  owned: number;
  bronzeCost: number;
  canForge: boolean;
  reason: string | null;
  forgeBonus: number;
  attributes: { key: AttributeKey; name: string; value: number; nextValue: number }[];
}

function fragmentOf(item: Item): Item | null {
  return item.set ? (findItem(item.set + "-fragment") ?? null) : null;
}

export function findForgePiece(
  state: GameState,
  itemId: string,
  enhancement: number,
): ForgePiece | null {
  return listForge(state).find((row) => row.item.id === itemId && row.level === enhancement) ?? null;
}

export function listForge(state: GameState): ForgePiece[] {
  const characterLevel = state.character?.level ?? 1;
  const bronze = state.character?.bronze ?? 0;

  const pieces: ForgePiece[] = [];
  for (const entry of state.inventory) {
    const item = findItem(entry.itemId);
    if (!item || !isEquippable(item)) continue;

    const level = entry.enhancement;
    const fragment = fragmentOf(item);
    const cost = enhancementCost(level + 1);
    const owned = fragment ? countInInventory(state.inventory, fragment.id) : 0;
    const bronzeCost = forgeBronzeCost(characterLevel, level);
    const maxed = level >= MAX_ENHANCEMENT;

    const current = enhancedEffect(item, level);
    const next = enhancedEffect(item, level + 1);
    const forgeBonus = ATTRIBUTES.reduce((sum, definition) => {
      const enhanced = current.attributes?.[definition.key] ?? 0;
      const rawBase = item.effect.attributes?.[definition.key] ?? 0;
      return sum + Math.max(0, enhanced - rawBase);
    }, 0);

    pieces.push({
      item,
      level,
      quantity: entry.quantity,
      fragment,
      cost,
      owned,
      bronzeCost,
      forgeBonus,
      canForge: Boolean(fragment) && !maxed && owned >= cost && bronze >= bronzeCost,
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
    });
  }

  return pieces.sort(
    (a, b) =>
      EQUIPMENT_SLOTS.indexOf(a.item.category as EquipmentSlot) -
        EQUIPMENT_SLOTS.indexOf(b.item.category as EquipmentSlot) || a.level - b.level,
  );
}

export function enhance(
  state: GameState,
  itemId: string,
  enhancement: number,
  random: Random = defaultRandom,
): Result<{ raised: boolean }> {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const item = findItem(itemId);
  if (!item || !isEquippable(item)) return failure(state, "Item desconhecido.");

  if (countInInventory(state.inventory, itemId, enhancement) < 1) {
    return failure(state, enhancedName(item.name, enhancement) + " não está na mochila.");
  }

  const level = enhancement;
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

  const bronzeCost = forgeBronzeCost(character.level, level);
  if (character.bronze < bronzeCost) {
    return failure(
      state,
      "A martelada pede " + formatBronze(bronzeCost) + " e a bolsa não cobre.",
    );
  }

  const struck = chance(FORGE_SUCCESS_RATIO, random);
  let inventory = removeFromInventory(state.inventory, fragment.id, cost);
  if (struck) {
    inventory = removeFromInventory(inventory, itemId, 1, level);
    inventory = addToInventory(inventory, itemId, 1, level + 1);
  }
  const next: GameState = {
    ...state,
    character: { ...character, bronze: character.bronze - bronzeCost },
    inventory,
  };

  const message = struck
    ? item.name + " sai da bigorna em +" + (level + 1) + "."
    : "A martelada falha e os fragmentos se perdem: " +
      item.name +
      (level > 0 ? " segue em +" + level + "." : " segue como estava.");
  return success(addLog(next, "system", message), message, { raised: struck });
}
