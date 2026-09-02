import { ECONOMY } from "@/shared/config/economy";
import { TRAINING_TICKS_MAX, TRAINING_TICKS_MIN } from "@/shared/constants/game";
import { levelYield } from "@/shared/constants/tuning";
import { defaultRandom, intBetween, type Random } from "@/shared/utils/random";
import { progressNeeded } from "./progression";

export interface TrainingEffort {
  progress: number;
}

export const TRAINING_SESSION_HUNTS = ECONOMY.trainingSessionHunts;

export function trainingSessionTicks(random: Random = defaultRandom): number {
  return intBetween(TRAINING_TICKS_MIN, TRAINING_TICKS_MAX, random);
}

export function trainingEffort(value: number): TrainingEffort {
  return { progress: levelYield(value) };
}

export function trainingSessionsPerPoint(value: number): number {
  return Math.max(1, Math.ceil(progressNeeded(value) / trainingEffort(value).progress));
}

export function trainingSessionCost(_level: number, _value: number): number {
  return 0;
}

export function trainingPointCost(level: number, value: number): number {
  return trainingSessionCost(level, value) * trainingSessionsPerPoint(value);
}
