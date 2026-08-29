import { PET_MAX_LEVEL, PET_PRICE, PET_RENAME_PRICE } from "@/shared/constants/game";
import { formatBronze } from "@/shared/utils/format";
import { generateId } from "@/shared/utils/id";
import { findItem } from "@/models/data/items";
import type { GameState } from "@/models/entities/game-state";
import type { Pet, PetGender } from "@/models/entities/pet";
import { failure, success, type Result } from "@/models/entities/result";
import {
  growPet,
  isPetActive,
  isPetAwake,
  isPetWhole,
  petMaxEnergy,
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

export function adoptPet(state: GameState, gender: PetGender, name: string): Result {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");
  if (state.pet) return failure(state, state.pet.name + " já anda com você.");

  const problem = validateName(name);
  if (problem) return failure(state, problem);
  if (character.bronze < PET_PRICE) {
    return failure(
      state,
      "Faltam " + formatBronze(PET_PRICE - character.bronze) + " para a adoção.",
    );
  }

  const pet: Pet = {
    id: generateId("pet"),
    name: capitalizeName(name),
    gender,
    energy: petMaxEnergy(1),
    active: true,
    adoptedAt: new Date().toISOString(),
  };

  const next: GameState = syncCharacter({
    ...state,
    character: { ...character, bronze: character.bronze - PET_PRICE },
    pet,
  });

  const message = pet.name + " agora caça com você. Treine para o lobo render na caçada.";
  return success(addLog(next, "character", message), message);
}

export function setPetActive(state: GameState, active: boolean): Result {
  const pet = state.pet;
  if (!pet) return failure(state, "Você não tem mascote.");
  if ((pet.active !== false) === active) {
    return failure(state, pet.name + (active ? " já está na caçada." : " já está fora da caçada."));
  }

  const next: GameState = syncCharacter({ ...state, pet: { ...pet, active } });
  const message = active
    ? pet.name + " se levanta e volta a caçar com você."
    : pet.name + " fica de fora das próximas caçadas.";

  return success(addLog(next, "character", message), message);
}

export function renamePet(state: GameState, name: string): Result {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const pet = state.pet;
  if (!pet) return failure(state, "Você não tem mascote para renomear.");

  const problem = validateName(name);
  if (problem) return failure(state, problem);

  const clean = capitalizeName(name);
  if (clean === pet.name) return failure(state, pet.name + " já responde por esse nome.");

  if (character.bronze < PET_RENAME_PRICE) {
    return failure(
      state,
      "A troca de nome custa " +
        formatBronze(PET_RENAME_PRICE) +
        " e faltam " +
        formatBronze(PET_RENAME_PRICE - character.bronze) +
        ".",
    );
  }

  const next: GameState = {
    ...state,
    character: { ...character, bronze: character.bronze - PET_RENAME_PRICE },
    pet: { ...pet, name: clean },
  };

  const message = pet.name + " agora atende por " + clean + ".";
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
  transformed: boolean;
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
  const transformed = character.form === "werewolf";

  return {
    pet,
    level,
    progress: maxed ? needed : (pet.trainingProgress ?? 0),
    needed,
    cost,
    effort: { progress: petTrainingEffort(level) },
    affordable,
    maxed,
    transformed,
    reason: maxed
      ? "Mascote no teto"
      : !transformed
        ? "Só a fera treina"
        : !affordable
          ? "Bronze insuficiente"
          : null,
  };
}

export function trainPet(state: GameState): Result<{ leveled: boolean }> {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const pet = state.pet;
  if (!pet) return failure(state, "Você não tem mascote para treinar.");

  const level = petLevelOf(pet);
  if (level >= PET_MAX_LEVEL) {
    return failure(state, pet.name + " já está no teto de NV. " + PET_MAX_LEVEL + ".");
  }

  if (character.form !== "werewolf") {
    return failure(state, "Só a fera treina. Transforme-se antes de subir no pátio.");
  }

  const cost = petTrainingSessionCost(level, character.level);
  if (character.bronze < cost) {
    return failure(
      state,
      "Cada treino é pago na hora: custa " +
        formatBronze(cost) +
        " e faltam " +
        formatBronze(cost - character.bronze) +
        ".",
    );
  }

  const { pet: grown, leveled } = growPet(pet, petTrainingEffort(level));

  const next: GameState = syncCharacter({
    ...state,
    character: { ...character, bronze: character.bronze - cost },
    pet: grown,
  });

  const message = leveled
    ? pet.name + " termina a sessão maior do que entrou: NV. " + petLevelOf(grown) + "."
    : pet.name + " treina ao seu lado. O corpo dele registra o esforço.";
  return success(addLog(next, "training", message), message, { leveled });
}

export function restPetTick(state: GameState): Result<{ whole: boolean }> {
  const pet = state.pet;
  if (!pet) return failure(state, "Você não tem mascote.");
  if (isPetActive(pet)) return failure(state, pet.name + " está na caçada, não em repouso.");
  if (isPetWhole(pet)) return success(state, "", { whole: true });

  const rested = restPet(pet, petRestStep(pet));
  const whole = isPetWhole(rested);
  const message = whole ? rested.name + " está de pé, inteiro e pronto." : "";

  return success(syncCharacter({ ...state, pet: rested }), message, { whole });
}

export function releasePet(state: GameState): Result {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const pet = state.pet;
  if (!pet) return failure(state, "Você não tem mascote para soltar.");

  const next: GameState = syncCharacter({ ...state, pet: null });

  const message = pet.name + " foi solto e parte sem olhar para trás.";
  return success(addLog(next, "character", message), message);
}

export function feedPet(state: GameState, itemId: string): Result {
  const pet = state.pet;
  if (!pet) return failure(state, "Você não tem mascote para cuidar.");

  const item = findItem(itemId);
  if (!item) return failure(state, "Item desconhecido.");
  if (!servesPet(item)) return failure(state, item.name + " não serve para o mascote.");
  if (countInInventory(state.inventory, itemId) <= 0) {
    return failure(state, item.name + " não está no inventário.");
  }

  const energy = petRationOf(item, pet);
  if (energy <= 0 || isPetWhole(pet)) {
    return failure(state, pet.name + " não precisa disso agora.");
  }

  const fed = restPet(pet, energy);
  const next: GameState = syncCharacter({
    ...state,
    pet: fed,
    inventory: removeFromInventory(state.inventory, itemId, 1),
  });

  const woke = !isPetAwake(pet) && isPetAwake(fed);
  const message = woke
    ? fed.name + " se levanta e volta para a caçada."
    : fed.name + " aceita " + item.name.toLowerCase() + " e se recompõe.";

  return success(addLog(next, "character", message), message);
}
