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
import { findOre, MINING_MAX_LEVEL, ORES, type MiningState, type Ore } from "@/models/entities/mining";
import { failure, success, type Result } from "@/models/entities/result";
import { formatBronze, formatCooldown } from "@/shared/utils/format";
import {
  enhancementCost,
  enhancementOf,
  enhancedEffect,
  forgeBronzeCost,
} from "@/models/rules/forge";
import {
  applyMiningProgress,
  miningExhausted,
  miningNeeded,
  miningRemaining,
  miningResetsInMs,
  miningYieldBonus,
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

  const yielded = intBetween(ore.minYield, ore.maxYield, random) * miningYieldBonus(rolled.level);
  const { mining: advanced, levelsGained } = applyMiningProgress(rolled, ore.progress);
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

export interface ForgePiece {
  item: Item;
  level: number;
  fragment: Item | null;
  cost: number;
  owned: number;
  bronzeCost: number;
  canForge: boolean;
  reason: string | null;
  attributes: { key: AttributeKey; name: string; value: number; nextValue: number }[];
}

function fragmentOf(item: Item): Item | null {
  return item.set ? (findItem(item.set + "-fragment") ?? null) : null;
}

// The anvil beats a piece off the body, so it lists the wearables sitting in the
// bag and never the seven equipped slots. A piece has to be unequipped to forge.
export function listForge(state: GameState): ForgePiece[] {
  const characterLevel = state.character?.level ?? 1;
  const bronze = state.character?.bronze ?? 0;

  const pieces: ForgePiece[] = [];
  for (const entry of state.inventory) {
    const item = findItem(entry.itemId);
    if (!item || !isEquippable(item)) continue;
    // A worn piece can never be forged, so it never appears on the anvil.
    if (EQUIPMENT_SLOTS.some((slot) => state.equipment[slot] === item.id)) continue;

    const level = enhancementOf(state.enhancements, item.id);
    const fragment = fragmentOf(item);
    const cost = enhancementCost(level + 1);
    const owned = fragment ? countInInventory(state.inventory, fragment.id) : 0;
    const bronzeCost = forgeBronzeCost(characterLevel, level);
    const maxed = level >= MAX_ENHANCEMENT;

    const current = enhancedEffect(item, level);
    const next = enhancedEffect(item, level + 1);

    pieces.push({
      item,
      level,
      fragment,
      cost,
      owned,
      bronzeCost,
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
      EQUIPMENT_SLOTS.indexOf(b.item.category as EquipmentSlot),
  );
}

export function enhance(
  state: GameState,
  itemId: string,
  random: Random = defaultRandom,
): Result<{ raised: boolean }> {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const item = findItem(itemId);
  if (!item || !isEquippable(item)) return failure(state, "Item desconhecido.");

  // Only a piece off the body, sitting in the bag, can be forged.
  if (EQUIPMENT_SLOTS.some((slot) => state.equipment[slot] === itemId)) {
    return failure(state, "Desequipe " + item.name + " para forjar.");
  }
  if (countInInventory(state.inventory, itemId) < 1) {
    return failure(state, item.name + " não está na mochila.");
  }

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

  const bronzeCost = forgeBronzeCost(character.level, level);
  if (character.bronze < bronzeCost) {
    return failure(
      state,
      "A martelada pede " + formatBronze(bronzeCost) + " e a bolsa não cobre.",
    );
  }

  const struck = chance(FORGE_SUCCESS_RATIO, random);
  const next: GameState = {
    ...state,
    character: { ...character, bronze: character.bronze - bronzeCost },
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
