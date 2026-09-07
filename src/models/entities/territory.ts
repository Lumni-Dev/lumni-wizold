import type { SpeciesKey } from "./creature";

export type DangerLevel = "low" | "moderate" | "high" | "extreme";

export interface Territory {
  id: string;
  name: string;
  description: string;
  species: SpeciesKey;
  minLevel: number;
  maxLevel: number;
  danger: DangerLevel;
  creatures: readonly string[];
}

export const DANGER_LABEL: Record<DangerLevel, string> = {
  low: "Low danger",
  moderate: "Moderate danger",
  high: "High danger",
  extreme: "Extreme danger",
};
