import { MAX_CHARACTER_LEVEL } from "@/shared/constants/game";
import { BALANCE } from "@/shared/constants/tuning/balance";
import { SPECIES_ORDER, type LevelBand, type SpeciesKey } from "../entities/creature";
import { SPECIES } from "../data/species-catalog";
import { huntPurse } from "./economy";
import { referenceHunter } from "./reference";

const LEVEL_STEP = 5;

function roundToStep(value: number): number {
  return Math.max(LEVEL_STEP, Math.round(value / LEVEL_STEP) * LEVEL_STEP);
}

function speciesBand(index: number): LevelBand {
  const size = MAX_CHARACTER_LEVEL / SPECIES_ORDER.length;
  const last = SPECIES_ORDER.length - 1;

  return {
    start: index === 0 ? 1 : roundToStep(index * size) + LEVEL_STEP,
    end: index === last ? MAX_CHARACTER_LEVEL : roundToStep((index + 1) * size),
  };
}

export function bandOf(key: SpeciesKey): LevelBand {
  return speciesBand(SPECIES_ORDER.indexOf(key));
}

function areaOf(level: number): number {
  const areaLevels = MAX_CHARACTER_LEVEL / 10;
  return Math.max(1, Math.min(10, Math.ceil(level / areaLevels)));
}

export function speciesNumbers(key: SpeciesKey, level: number) {
  const definition = SPECIES.find((entry) => entry.key === key) ?? SPECIES[0];
  const profile = definition.profile;
  const difficulty = definition.difficulty;
  const hunter = referenceHunter(level);

  const strength = Math.max(
    1,
    Math.round(Math.sqrt(BALANCE.creatureHit * hunter.endurance * profile.strength)),
  );
  const endurance = Math.max(
    1,
    Math.round(hunter.strength * BALANCE.creatureResRatio * profile.endurance),
  );

  const hunterBlow = (hunter.strength * hunter.strength) / (hunter.strength + endurance);
  const petPad = areaOf(level) >= BALANCE.petFromArea ? 1 + BALANCE.petKillBoost : 1;
  const health = Math.max(
    1,
    Math.round(BALANCE.creatureKillRounds * hunterBlow * petPad * profile.health * difficulty),
  );

  const purse = huntPurse(level);

  return {
    health,
    strength,
    endurance,
    agility: Math.round((4 + level * 0.5) * profile.agility),
    experience: Math.round(12 + level * 7),
    minBronze: Math.round(purse * 0.7),
    maxBronze: Math.round(purse * 1.3),
  };
}
