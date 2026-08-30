import type { Creature } from "../types";

// Fênix Menor (NV. 921 a 930) da área Clareira Branca.
export const lesserPhoenix: Creature = {
  id: "lesser-phoenix",
  name: "Fênix Menor",
  image: "",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 921,
  health: 18804,
  strength: 3741,
  endurance: 2652,
  agility: 607,
  experience: 6494,
  minBronze: 2211,
  maxBronze: 4106,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
