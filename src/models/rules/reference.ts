import {
  BASE_ATTRIBUTE_VALUE,
  BASE_VITAL,
  ENHANCEMENT_STEP,
  MAX_ATTRIBUTE_VALUE,
  MAX_ENHANCEMENT,
  MAX_CHARACTER_LEVEL,
} from "@/shared/constants/game";
import { BALANCE } from "@/shared/constants/tuning/balance";
import { setAttributes, setForLevel } from "../data/equipment-sets";

const AREA_LEVELS = MAX_CHARACTER_LEVEL / 10;

export function referenceForge(level: number): number {
  const set = setForLevel(level);
  const span = AREA_LEVELS * 2 - 1;
  return Math.max(
    0,
    Math.min(MAX_ENHANCEMENT, Math.round((MAX_ENHANCEMENT * (level - set.minLevel)) / span)),
  );
}

function trainedAt(level: number): number {
  return Math.min(
    MAX_ATTRIBUTE_VALUE,
    Math.max(BASE_ATTRIBUTE_VALUE, Math.round(level * BALANCE.trainedPerLevel)),
  );
}

function forgedGear(level: number) {
  const multiplier = 1 + ENHANCEMENT_STEP * referenceForge(level);
  const lent = setAttributes(setForLevel(level));
  return { strength: lent.strength * multiplier, endurance: lent.endurance * multiplier };
}

export function referenceHunter(level: number) {
  const trained = trainedAt(level);
  const gear = forgedGear(level);
  return {
    strength: trained + gear.strength,
    endurance: trained + gear.endurance,
    health: BASE_VITAL,
  };
}
