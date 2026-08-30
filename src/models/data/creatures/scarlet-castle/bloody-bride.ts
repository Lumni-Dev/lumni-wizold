import type { Creature } from "../types";

// Noiva Sangrenta (NV. 871 a 880) da área Castelo Escarlate.
export const bloodyBride: Creature = {
  id: "bloody-bride",
  name: "Noiva Sangrenta",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 871,
  health: 24370,
  strength: 4641,
  endurance: 2635,
  agility: 575,
  experience: 6144,
  minBronze: 2194,
  maxBronze: 4074,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
