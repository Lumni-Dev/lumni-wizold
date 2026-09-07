import type { Creature } from "../types";

export const abyssLord: Creature = {
  id: "abyss-lord",
  name: "Lord of the Abyss",
  description: "Nothing here is gentle. The horn runs you through before you hear the gallop.",
  species: "unicorn",
  level: 781,
  health: 102821,
  strength: 233,
  endurance: 13503,
  agility: 437,
  experience: 5514,
  minBronze: 13,
  maxBronze: 25,
  drops: [
    { itemId: "abyss-crown", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "demon-horn", chance: 0.07, minimum: 1, maximum: 1 },
  ],
};
