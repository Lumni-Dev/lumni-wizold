// Mascote: os números que moldam o lobo (poder, energia e economia). O nível de
// adoção (um terço do teto) e o teto do mascote ficam em game.ts, porque dependem
// do teto de nível e da env. PET_HUNT_SHARE vive na regra do pet.
export const PET = {
  price: 50_000,
  renamePrice: 10_000,
  baseBonus: 5,
  baseEnergy: 100,
  energyPerLevel: 4,
  energyPerHunt: 4,
  energyPerBlow: 2,
  biteEnergy: 6,
  restRatio: 0.1,
  attackRatio: 0.5,
  targetChance: 0.2,
};
