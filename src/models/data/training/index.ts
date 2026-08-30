import { trunkPunches } from "./trunk-punches";
import { shadowRun } from "./shadow-run";
import { iceBath } from "./ice-bath";
import { blindTracking } from "./blind-tracking";
import { lunarMeditation } from "./lunar-meditation";
import type { Exercise } from "./types";

export type { Exercise } from "./types";

// One exercise per attribute, one file each. The same exercise follows the
// character from level 1 to the ceiling; what a session yields is a rule, not data.
export const EXERCISES: readonly Exercise[] = [
  trunkPunches,
  shadowRun,
  iceBath,
  blindTracking,
  lunarMeditation,
];

const EXERCISE_INDEX = new Map<string, Exercise>(
  EXERCISES.map((exercise) => [exercise.id, exercise]),
);

export function findExercise(exerciseId: string): Exercise | undefined {
  return EXERCISE_INDEX.get(exerciseId);
}
