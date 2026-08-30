import type { Creature } from "../types";

// Basilisco (NV. 581 a 590) da área Ermo Cinza.
export const basilisk: Creature = {
  id: "basilisk",
  name: "Basilisco",
  image: "/assets/creatures/grey-wastes/basilisk.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 581,
  health: 5435,
  strength: 1104,
  endurance: 766,
  agility: 386,
  experience: 4114,
  minBronze: 794,
  maxBronze: 1474,
  drops: [
    { itemId: "basilisk-fang", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "basilisk-scale", chance: 0.07, minimum: 1, maximum: 1 },
  ],
};
