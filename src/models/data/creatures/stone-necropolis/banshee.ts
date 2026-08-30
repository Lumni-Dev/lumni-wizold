import type { Creature } from "../types";

// Banshee (NV. 651 a 660) da área Necrópole de Pedra.
export const banshee: Creature = {
  id: "banshee",
  name: "Banshee",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 651,
  health: 10226,
  strength: 1970,
  endurance: 1105,
  agility: 432,
  experience: 4604,
  minBronze: 1133,
  maxBronze: 2105,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
