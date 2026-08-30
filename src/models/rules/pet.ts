import { huntPurse } from "../data/species";
import {
  PET_BASE_BONUS,
  PET_BASE_ENERGY,
  PET_PRICE,
  PET_REST_RATIO,
  PET_ENERGY_PER_BLOW,
  PET_ENERGY_PER_HUNT,
  PET_ENERGY_PER_LEVEL,
  PET_MAX_LEVEL,
} from "@/shared/constants/game";
import { clamp } from "@/shared/utils/format";
import { emptyAttributes, type Attributes } from "../entities/attribute";
import type { Item } from "../entities/item";
import type { Pet } from "../entities/pet";

export function petPrice(): number {
  return PET_PRICE;
}

export function isPetAwake(pet: Pet | null | undefined): pet is Pet {
  return Boolean(pet) && (pet as Pet).energy > 0;
}

export function isPetActive(pet: Pet | null | undefined): boolean {
  return Boolean(pet) && pet?.active !== false;
}

export function isPetHunting(pet: Pet | null | undefined): pet is Pet {
  return isPetAwake(pet) && isPetActive(pet);
}

export function petShortOfBreath(pet: Pet): boolean {
  return pet.energy < PET_ENERGY_PER_HUNT + PET_ENERGY_PER_BLOW;
}

export function canPetFight(pet: Pet | null | undefined): pet is Pet {
  return isPetHunting(pet) && !petShortOfBreath(pet);
}

export function petLevelOf(pet: Pet | null | undefined): number {
  return pet?.level ?? 1;
}

export function petTrainingNeeded(level: number): number {
  return Math.round(20 * level * (1 + level / 25));
}

export function petTrainingPointCost(level: number, hunterLevel: number): number {
  return Math.max(1, Math.round(huntPurse(hunterLevel) * 3 * (1 + level / 50)));
}

export function petTrainingEffort(level: number): number {
  return Math.max(1, Math.round(petTrainingNeeded(level) / 5));
}

export function petTrainingSessionCost(level: number, hunterLevel: number): number {
  return (
    Math.max(1, Math.round(petTrainingPointCost(level, hunterLevel) / 5)) +
    Math.max(0, level - 1)
  );
}

export const PET_HUNT_SHARE = 0.35;

export function petHuntEffort(level: number): number {
  return Math.max(1, Math.round(petTrainingEffort(level) * PET_HUNT_SHARE));
}

export function growPet(pet: Pet, effort: number): { pet: Pet; leveled: boolean } {
  const level = petLevelOf(pet);
  if (level >= PET_MAX_LEVEL) return { pet: { ...pet, trainingProgress: 0 }, leveled: false };

  let progress = (pet.trainingProgress ?? 0) + effort;
  let nextLevel = level;
  let leveled = false;

  while (nextLevel < PET_MAX_LEVEL && progress >= petTrainingNeeded(nextLevel)) {
    progress -= petTrainingNeeded(nextLevel);
    nextLevel += 1;
    leveled = true;
  }
  if (nextLevel >= PET_MAX_LEVEL) progress = 0;

  return { pet: { ...pet, level: nextLevel, trainingProgress: progress }, leveled };
}

export function petLevelBonus(level: number): Attributes {
  const bonus = emptyAttributes();
  const lent = PET_BASE_BONUS + Math.max(0, clamp(level, 1, PET_MAX_LEVEL) - 1);

  bonus.strength += lent;
  bonus.agility += lent;
  bonus.instinct += lent;
  return bonus;
}

export function petBonus(pet: Pet | null | undefined): Attributes {
  if (!isPetHunting(pet)) return emptyAttributes();
  return petLevelBonus(petLevelOf(pet));
}

export function petMaxEnergy(level: number): number {
  const climbed = clamp(level, 1, PET_MAX_LEVEL) - 1;
  return PET_BASE_ENERGY + climbed * PET_ENERGY_PER_LEVEL;
}

function clampPetEnergy(pet: Pet): Pet {
  return {
    ...pet,
    energy: clamp(Math.round(pet.energy), 0, petMaxEnergy(petLevelOf(pet))),
  };
}

export function spendPetEnergy(pet: Pet, amount: number): Pet {
  return clampPetEnergy({ ...pet, energy: pet.energy - amount });
}

export function restPet(pet: Pet, amount: number): Pet {
  return clampPetEnergy({ ...pet, energy: pet.energy + amount });
}

export function petRestStep(pet: Pet): number {
  return Math.max(1, Math.round(petMaxEnergy(petLevelOf(pet)) * PET_REST_RATIO));
}

export function isPetWhole(pet: Pet): boolean {
  return pet.energy >= petMaxEnergy(petLevelOf(pet));
}

export function servesPet(item: Item): boolean {
  return item.category === "pet";
}

export function petRationOf(item: Item, pet: Pet): number {
  return Math.round(petMaxEnergy(petLevelOf(pet)) * (item.effect.petEnergyRatio ?? 0));
}
