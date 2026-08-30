import type { Creature } from "../types";

// Sanguessuga Gigante (NV. 321 a 330) da área Pântano Pálido.
export const giantLeech: Creature = {
  id: "giant-leech",
  name: "Sanguessuga Gigante",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 321,
  health: 2048,
  strength: 415,
  endurance: 220,
  agility: 217,
  experience: 2294,
  minBronze: 239,
  maxBronze: 443,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
