import type { Creature } from "../types";

// Mestre Caçador (NV. 491 a 500) da área Estrada dos Caçadores.
export const masterHunter: Creature = {
  id: "master-hunter",
  name: "Mestre Caçador",
  image: "/assets/creatures/hunter-road/master-hunter.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 491,
  health: 5256,
  strength: 1061,
  endurance: 740,
  agility: 328,
  experience: 3484,
  minBronze: 763,
  maxBronze: 1417,
  drops: [
    { itemId: "master-trophy", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "silver-charm", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
