import type { Creature } from "../types";

// Basilisco (NV. 581 a 590) da área Ermo Cinza.
export const basilisk: Creature = {
  id: "basilisk",
  name: "Basilisco",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 581,
  health: 22044,
  strength: 111,
  endurance: 2691,
  agility: 386,
  experience: 4114,
  minBronze: 11,
  maxBronze: 20,
  drops: [
    { itemId: "basilisk-fang", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "basilisk-scale", chance: 0.07, minimum: 1, maximum: 1 },
  ],
};
