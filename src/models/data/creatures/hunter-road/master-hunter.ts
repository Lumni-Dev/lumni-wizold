import type { Creature } from "../types";

// Mestre Caçador (NV. 491 a 500) da área Estrada dos Caçadores.
export const masterHunter: Creature = {
  id: "master-hunter",
  name: "Mestre Caçador",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 491,
  health: 14686,
  strength: 90,
  endurance: 1792,
  agility: 328,
  experience: 3484,
  minBronze: 9,
  maxBronze: 17,
  drops: [
    { itemId: "master-trophy", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "silver-charm", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
