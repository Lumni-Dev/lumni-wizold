import { MAX_ATTRIBUTE_VALUE } from "@/shared/constants/game";
import { EXERCISES, findExercise } from "@/models/data/exercises";
import { ATTRIBUTES, findAttribute, type AttributeKey } from "@/models/entities/attribute";
import type { GameState } from "@/models/entities/game-state";
import { failure, success, type Result } from "@/models/entities/result";
import type { Exercise } from "@/models/entities/exercise";
import { applyTrainingProgress, progressNeeded } from "@/models/rules/progression";
import {
  trainingEffort,
  trainingSessionsPerPoint,
  type TrainingEffort,
} from "@/models/rules/training";
import { syncCharacter } from "./character.controller";
import { addLog } from "./log.controller";

export interface AvailableExercise {
  exercise: Exercise;
  effort: TrainingEffort;
  cost: number;
  affordable: boolean;
  maxed: boolean;
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

  return EXERCISES.map((exercise) => {
    const value = character?.attributes[exercise.attribute] ?? 1;
    const effort = trainingEffort(value);
    const maxed = character !== null && value >= MAX_ATTRIBUTE_VALUE;
    const affordable = character !== null && !maxed;

    return {
      exercise,
      effort,
      cost: 0,
      affordable,
      maxed,
      reason: maxed ? "Atributo no teto" : null,
    };
  });
}

export function trainingSummaryLine(
  attributeName: string,
  value: number,
  effort: TrainingEffort,
): string {
  const sessions = trainingSessionsPerPoint(value);
  return (
    "Treina " +
    attributeName +
    ": cada ponto completo soma +1. Agora +" +
    effort.progress +
    " de progresso por sessão; faltam cerca de " +
    sessions +
    " sessões para o próximo ponto. Gratuito."
  );
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

  const effort = trainingEffort(character.attributes[exercise.attribute]);

  if (character.attributes[exercise.attribute] >= MAX_ATTRIBUTE_VALUE) {
    const definition = findAttribute(exercise.attribute);
    return failure(
      state,
      (definition?.name ?? "O atributo") + " já está no teto de " + MAX_ATTRIBUTE_VALUE + ".",
    );
  }

  const { character: trained, pointsGained } = applyTrainingProgress(
    character,
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
