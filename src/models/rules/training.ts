import { levelYield } from "@/shared/constants/tuning";
import { huntPurse } from "../data/species";
import { progressNeeded } from "./progression";

export interface TrainingEffort {
  progress: number;
}

const TRAINING_POINT_COST_IN_HUNTS = 3;

export function trainingPointCost(level: number): number {
  return Math.max(1, Math.round(huntPurse(level) * TRAINING_POINT_COST_IN_HUNTS));
}

export function trainingEffort(value: number): TrainingEffort {
  return { progress: levelYield(value) };
}

export function trainingSessionsPerPoint(value: number): number {
  return Math.max(1, Math.ceil(progressNeeded(value) / trainingEffort(value).progress));
}

export function trainingSessionCost(level: number, value: number): number {
  return Math.max(1, Math.round(trainingPointCost(level) / trainingSessionsPerPoint(value)));
}
