import type { Creature } from "../types";

// Basilisco (NV. 581 a 590) da área Ermo Cinza.
export const basilisk: Creature = {
  id: "basilisk",
  name: "Basilisco",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 581,
  health: 7089,
  strength: 1379,
  endurance: 766,
  agility: 386,
  experience: 4114,
  minBronze: 794,
  maxBronze: 1474,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
