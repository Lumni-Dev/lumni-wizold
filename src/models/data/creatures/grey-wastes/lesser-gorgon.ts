import type { Creature } from "../types";

// Górgona Menor (NV. 561 a 570) da área Ermo Cinza.
export const lesserGorgon: Creature = {
  id: "lesser-gorgon",
  name: "Górgona Menor",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 561,
  health: 7037,
  strength: 1367,
  endurance: 760,
  agility: 373,
  experience: 3974,
  minBronze: 787,
  maxBronze: 1461,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
