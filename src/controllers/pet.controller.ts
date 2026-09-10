import { PET_MAX_LEVEL, PET_MIN_LEVEL } from "@/shared/constants/game";
import { formatBronze } from "@/shared/utils/format";
import { generateId } from "@/shared/utils/id";
import { findItem } from "@/models/data/items";
import type { GameState } from "@/models/entities/game-state";
import type { Pet } from "@/models/entities/pet";
import { failure, success, type Result } from "@/models/entities/result";
import {
  growPet,
  isPetActive,
  isPetAwake,
  isPetWhole,
  petMaxEnergy,
  petPrice,
  petRenamePrice,
  petRationOf,
  petRestStep,
  petLevelOf,
  petTrainingSessionCost,
  petTrainingEffort,
  petTrainingNeeded,
  restPet,
  servesPet,
} from "@/models/rules/pet";
import type { TrainingEffort } from "@/models/rules/training";
import { capitalizeName, syncCharacter, validateName } from "./character.controller";
import { countInInventory, removeFromInventory } from "./inventory.controller";
import { addLog } from "./log.controller";

export function adoptPet(state: GameState, name: string): Result {
  const character = state.character;
  if (!character) return failure(state, "No active character.");
  if (state.pet) return failure(state, "The companion already walks with you.");

  const problem = validateName(name);
  if (problem) return failure(state, problem);
  if (character.level < PET_MIN_LEVEL) {
    return failure(state, "The wolf only hunts beside a LV " + PET_MIN_LEVEL + " or higher.");
  }
  const price = petPrice(character.level);
  if (character.bronze < price) {
    return failure(state, formatBronze(price - character.bronze) + " short for the adoption.");
  }

  const pet: Pet = {
    id: generateId("pet"),
    name: capitalizeName(name),
    energy: petMaxEnergy(1),
    active: true,
    adoptedAt: new Date().toISOString(),
  };

  const next: GameState = syncCharacter({
    ...state,
    character: { ...character, bronze: character.bronze - price },
    pet,
  });

  const message = "The companion now hunts with you. Train it so it earns its keep on the hunt.";
  return success(addLog(next, "character", message), message);
}

export function setPetActive(state: GameState, active: boolean): Result {
  const pet = state.pet;
  if (!pet) return failure(state, "You have no companion.");
  if ((pet.active !== false) === active) {
    return failure(state, "The companion" + (active ? " is already on the hunt." : " is already out of the hunt."));
  }

  const next: GameState = syncCharacter({ ...state, pet: { ...pet, active } });
  const message = active
    ? "The companion gets up and hunts with you again."
    : "The companion sits out the next hunts.";

  return success(addLog(next, "character", message), message);
}

export function renamePet(state: GameState, name: string): Result {
  const character = state.character;
  if (!character) return failure(state, "No active character.");

  const pet = state.pet;
  if (!pet) return failure(state, "You have no companion to rename.");

  const problem = validateName(name);
  if (problem) return failure(state, problem);

  const clean = capitalizeName(name);
  if (clean === pet.name) return failure(state, "The companion already answers to that name.");

  const renamePrice = petRenamePrice(character.level);
  if (character.bronze < renamePrice) {
    return failure(
      state,
      "The name change costs " +
        formatBronze(renamePrice) +
        " and you are " +
        formatBronze(renamePrice - character.bronze) +
        " short.",
    );
  }

  const next: GameState = {
    ...state,
    character: { ...character, bronze: character.bronze - renamePrice },
    pet: { ...pet, name: clean },
  };

  const message = "The companion now answers to " + clean + ".";
  return success(addLog(next, "character", message), message);
}

export interface PetTrainingView {
  pet: Pet;
  level: number;
  progress: number;
  needed: number;
  cost: number;
  effort: TrainingEffort;
  affordable: boolean;
  maxed: boolean;
  reason: string | null;
}

export function petTrainingView(state: GameState): PetTrainingView | null {
  const character = state.character;
  const pet = state.pet;
  if (!character || !pet) return null;

  const level = petLevelOf(pet);
  const maxed = level >= PET_MAX_LEVEL;
  const cost = petTrainingSessionCost(level, character.level);
  const affordable = character.bronze >= cost;
  const needed = petTrainingNeeded(level);

  return {
    pet,
    level,
    progress: maxed ? needed : (pet.trainingProgress ?? 0),
    needed,
    cost,
    effort: { progress: petTrainingEffort(level) },
    affordable,
    maxed,
    reason: maxed ? "Companion at the cap" : !affordable ? "Not enough WCoins" : null,
  };
}

export function trainPet(state: GameState): Result<{ leveled: boolean }> {
  const character = state.character;
  if (!character) return failure(state, "No active character.");

  const pet = state.pet;
  if (!pet) return failure(state, "You have no companion to train.");

  const level = petLevelOf(pet);
  if (level >= PET_MAX_LEVEL) {
    return failure(state, "The companion is already at the LV. " + PET_MAX_LEVEL + " cap.");
  }

  const cost = petTrainingSessionCost(level, character.level);
  if (character.bronze < cost) {
    return failure(
      state,
      "Each training is paid on the spot: it costs " +
        formatBronze(cost) +
        " and you are " +
        formatBronze(cost - character.bronze) +
        " short.",
    );
  }

  const { pet: grown, leveled } = growPet(pet, petTrainingEffort(level));

  const next: GameState = syncCharacter({
    ...state,
    character: { ...character, bronze: character.bronze - cost },
    pet: grown,
  });

  const message = leveled
    ? "The companion ends the session bigger than it entered: LV. " + petLevelOf(grown) + "."
    : "The companion trains at your side. Its body records the effort.";
  return success(addLog(next, "training", message), message, { leveled });
}

export function restPetTick(state: GameState): Result<{ whole: boolean }> {
  const pet = state.pet;
  if (!pet) return failure(state, "You have no companion.");
  if (isPetActive(pet)) return failure(state, "The companion is on the hunt, not at rest.");
  if (isPetWhole(pet)) return success(state, "", { whole: true });

  const rested = restPet(pet, petRestStep(pet));
  const whole = isPetWhole(rested);
  const message = whole ? "The companion is up, whole and ready." : "";

  return success(syncCharacter({ ...state, pet: rested }), message, { whole });
}

export function releasePet(state: GameState): Result {
  const character = state.character;
  if (!character) return failure(state, "No active character.");

  const pet = state.pet;
  if (!pet) return failure(state, "You have no companion to release.");

  const next: GameState = syncCharacter({ ...state, pet: null });

  const message = "The companion was released and leaves without looking back.";
  return success(addLog(next, "character", message), message);
}

export function feedPet(state: GameState, itemId: string): Result {
  const pet = state.pet;
  if (!pet) return failure(state, "You have no companion to care for.");

  const item = findItem(itemId);
  if (!item) return failure(state, "Unknown item.");
  if (!servesPet(item)) return failure(state, item.name + " is no use to the companion.");
  if (countInInventory(state.inventory, itemId) <= 0) {
    return failure(state, item.name + " is not in the bag.");
  }

  const energy = petRationOf(item, pet);
  if (energy <= 0 || isPetWhole(pet)) {
    return failure(state, "The companion does not need that right now.");
  }

  const fed = restPet(pet, energy);
  const next: GameState = syncCharacter({
    ...state,
    pet: fed,
    inventory: removeFromInventory(state.inventory, itemId, 1),
  });

  const woke = !isPetAwake(pet) && isPetAwake(fed);
  const message = woke
    ? "The companion gets up and returns to the hunt."
    : "The companion takes " + item.name.toLowerCase() + " and mends itself.";

  return success(addLog(next, "character", message), message);
}
