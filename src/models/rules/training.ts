import { huntPurse } from "../data/species";

export interface TrainingEffort {
  progress: number;
}

const TRAINING_POINT_COST_IN_HUNTS = 3;

export function trainingPointCost(level: number): number {
  return Math.max(1, Math.round(huntPurse(level) * TRAINING_POINT_COST_IN_HUNTS));
}

export function trainingEffort(level: number): TrainingEffort {
  return { progress: Math.round(12 + level * 0.48) };
}
