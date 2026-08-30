import type { Creature } from "../types";

// Serpente Verde (NV. 141 a 150) da área Mata do Orvalho.
export const greenSerpent: Creature = {
  id: "green-serpent",
  name: "Serpente Verde",
  image: "",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 141,
  health: 340,
  strength: 77,
  endurance: 46,
  agility: 100,
  experience: 1034,
  minBronze: 55,
  maxBronze: 103,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
