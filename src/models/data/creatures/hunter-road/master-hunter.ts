import type { Creature } from "../types";

// Mestre Caçador (NV. 491 a 500) da área Estrada dos Caçadores.
export const masterHunter: Creature = {
  id: "master-hunter",
  name: "Mestre Caçador",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 491,
  health: 6856,
  strength: 1326,
  endurance: 740,
  agility: 328,
  experience: 3484,
  minBronze: 763,
  maxBronze: 1417,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
