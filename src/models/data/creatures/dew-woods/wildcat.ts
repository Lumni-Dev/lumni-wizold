import type { Creature } from "../types";

// Gato Selvagem (NV. 161 a 170) da área Mata do Orvalho.
export const wildcat: Creature = {
  id: "wildcat",
  name: "Gato Selvagem",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 161,
  health: 1098,
  strength: 27,
  endurance: 178,
  agility: 113,
  experience: 1174,
  minBronze: 4,
  maxBronze: 8,
  drops: [
    { itemId: "wildcat-pelt", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "sharp-fang", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
