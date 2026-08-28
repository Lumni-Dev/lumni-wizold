import type { Exercise } from "../entities/exercise";

export const EXERCISES: readonly Exercise[] = [
  {
    id: "trunk-punches",
    name: "Socos no Tronco",
    description: "Bater até a casca ceder ou até a mão ceder primeiro.",
    attribute: "strength",
  },
  {
    id: "shadow-run",
    name: "Corrida nas Sombras",
    description: "Atravessar o beco sem cruzar um único facho de luz.",
    attribute: "agility",
  },
  {
    id: "ice-bath",
    name: "Banho de Gelo",
    description: "Ficar no rio até o corpo parar de reclamar.",
    attribute: "endurance",
  },
  {
    id: "blind-tracking",
    name: "Rastreio Cego",
    description: "Seguir um rastro de olhos vendados, só pelo faro e pelo som.",
    attribute: "instinct",
  },
  {
    id: "lunar-meditation",
    name: "Meditação Lunar",
    description: "Encarar a lua sem deixar a fera assumir o comando.",
    attribute: "willpower",
  },
];

const EXERCISE_INDEX = new Map<string, Exercise>(
  EXERCISES.map((exercise) => [exercise.id, exercise]),
);

export function findExercise(exerciseId: string): Exercise | undefined {
  return EXERCISE_INDEX.get(exerciseId);
}
