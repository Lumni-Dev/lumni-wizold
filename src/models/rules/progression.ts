import { MAX_ATTRIBUTE_VALUE, MAX_CHARACTER_LEVEL } from "@/shared/constants/game";
import type { AttributeKey } from "../entities/attribute";
import type { Character } from "../entities/character";

const EXPERIENCE_PER_LEVEL = 100;

const LEVEL_CURVE = 25;

export function experienceForLevel(level: number): number {
  return Math.round(EXPERIENCE_PER_LEVEL * level * (1 + level / LEVEL_CURVE));
}

export function progressNeeded(currentValue: number): number {
  return 10 + currentValue * 4;
}

export interface ExperienceOutcome {
  character: Character;
  levelsGained: number;
}

export function applyExperience(character: Character, gain: number): ExperienceOutcome {
  let experience = character.experience + Math.max(0, Math.round(gain));
  let level = character.level;
  let levelsGained = 0;

  if (level < MAX_CHARACTER_LEVEL && experience >= experienceForLevel(level)) {
    experience = 0;
    level += 1;
    levelsGained = 1;
  }

  const capped = level >= MAX_CHARACTER_LEVEL ? experienceForLevel(level) : experience;

  return {
    character: { ...character, experience: capped, level },
    levelsGained,
  };
}

export function applyTrainingProgress(
  character: Character,
  attribute: AttributeKey,
  gain: number,
): { character: Character; pointsGained: number } {
  let progress = character.trainingProgress[attribute] + gain;
  let value = character.attributes[attribute];
  let pointsGained = 0;

  if (value < MAX_ATTRIBUTE_VALUE && progress >= progressNeeded(value)) {
    progress = 0;
    value += 1;
    pointsGained = 1;
  }

  if (value >= MAX_ATTRIBUTE_VALUE) progress = 0;

  return {
    character: {
      ...character,
      attributes: { ...character.attributes, [attribute]: value },
      trainingProgress: { ...character.trainingProgress, [attribute]: progress },
    },
    pointsGained,
  };
}
