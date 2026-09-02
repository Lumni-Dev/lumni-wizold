import type { Creature } from "../types";

// Górgona Menor (NV. 561 a 570) da área Ermo Cinza.
export const lesserGorgon: Creature = {
  id: "lesser-gorgon",
  name: "Górgona Menor",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 561,
  health: 20405,
  strength: 106,
  endurance: 2490,
  agility: 373,
  experience: 3974,
  minBronze: 10,
  maxBronze: 18,
  drops: [
    { itemId: "gorgon-scale", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "gorgon-eye", chance: 0.07, minimum: 1, maximum: 1 },
  ],
};
