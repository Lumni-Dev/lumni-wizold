import { MAX_ATTRIBUTE_VALUE } from "@/shared/constants/game";
import { EXERCISES, findExercise } from "@/models/data/exercises";
import { ATTRIBUTES, findAttribute, type AttributeKey } from "@/models/entities/attribute";
import type { GameState } from "@/models/entities/game-state";
import { failure, success, type Result } from "@/models/entities/result";
import type { Exercise } from "@/models/entities/exercise";
import { applyTrainingProgress, progressNeeded } from "@/models/rules/progression";
import { trainingCost, trainingEffort, type TrainingEffort } from "@/models/rules/training";
import { formatBronze } from "@/shared/utils/format";
import { syncCharacter } from "./character.controller";
import { addLog } from "./log.controller";

export interface AvailableExercise {
  exercise: Exercise;
  effort: TrainingEffort;
  cost: number;
  affordable: boolean;
  maxed: boolean;
  transformed: boolean;
  reason: string | null;
}

export interface AttributeProgress {
  key: AttributeKey;
  name: string;
  effect: string;
  value: number;
  progress: number;
  needed: number;
}

export function listExercises(state: GameState): AvailableExercise[] {
  const character = state.character;

  const effort = trainingEffort(character?.level ?? 1);
  const transformed = character?.form === "werewolf";

  return EXERCISES.map((exercise) => {
    const maxed =
      character !== null && character.attributes[exercise.attribute] >= MAX_ATTRIBUTE_VALUE;
    const cost = trainingCost(character?.level ?? 1);
    const affordable = character !== null && character.bronze >= cost;

    return {
      exercise,
      effort,
      cost,
      affordable,
      maxed,
      transformed,
      reason: maxed
        ? "Atributo no teto"
        : !affordable
          ? "Bronze insuficiente"
          : !transformed
            ? "Só a fera treina"
            : null,
    };
  });
}

export function listAttributeProgress(state: GameState): AttributeProgress[] {
  const character = state.character;
  if (!character) return [];

  return ATTRIBUTES.map((definition) => {
    const value = character.attributes[definition.key];
    const progress = character.trainingProgress[definition.key];
    const needed = progressNeeded(value);
    const maxed = value >= MAX_ATTRIBUTE_VALUE;

    return {
      key: definition.key,
      name: definition.name,
      effect: definition.effect,
      value,
      progress: maxed ? needed : progress,
      needed,
    };
  });
}

export interface TrainingReport {
  exercise: Exercise;
  attributeRaised: boolean;
}

export function train(state: GameState, exerciseId: string): Result<TrainingReport> {
  const character = state.character;
  if (!character) return failure(state, "Nenhum personagem ativo.");

  const exercise = findExercise(exerciseId);
  if (!exercise) return failure(state, "Exercício desconhecido.");

  const effort = trainingEffort(character.level);

  if (character.attributes[exercise.attribute] >= MAX_ATTRIBUTE_VALUE) {
    const definition = findAttribute(exercise.attribute);
    return failure(
      state,
      (definition?.name ?? "O atributo") + " já está no teto de " + MAX_ATTRIBUTE_VALUE + ".",
    );
  }

  const cost = trainingCost(character.level);
  if (character.bronze < cost) {
    return failure(
      state,
      "A sessão custa " +
        formatBronze(cost) +
        " e faltam " +
        formatBronze(cost - character.bronze) +
        ".",
    );
  }

  if (character.form !== "werewolf") {
    return failure(state, "Só a fera treina. Transforme-se antes de subir no pátio.");
  }

  const { character: trained, pointsGained } = applyTrainingProgress(
    { ...character, bronze: character.bronze - cost },
    exercise.attribute,
    effort.progress,
  );

  let next = syncCharacter({ ...state, character: trained });

  const definition = findAttribute(exercise.attribute);
  const message =
    pointsGained > 0
      ? exercise.name +
        " concluído. " +
        (definition?.name ?? "Atributo") +
        " subiu para " +
        trained.attributes[exercise.attribute] +
        "."
      : exercise.name + " concluído. O corpo registra o esforço.";

  next = addLog(next, "training", message);

  return success<TrainingReport>(next, message, {
    exercise,
    attributeRaised: pointsGained > 0,
  });
}
