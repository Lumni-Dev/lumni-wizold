import type { Creature } from "../types";

// Gato Selvagem (NV. 161 a 170) da área Mata do Orvalho.
export const wildcat: Creature = {
  id: "wildcat",
  name: "Gato Selvagem",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 161,
  health: 496,
  strength: 108,
  endurance: 52,
  agility: 113,
  experience: 1174,
  minBronze: 62,
  maxBronze: 116,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
