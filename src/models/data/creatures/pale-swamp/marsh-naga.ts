import type { Creature } from "../types";

export const marshNaga: Creature = {
  id: "marsh-naga",
  name: "Naga do Charco",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 371,
  health: 4074,
  strength: 54,
  endurance: 662,
  agility: 250,
  experience: 2644,
  minBronze: 8,
  maxBronze: 14,
  drops: [
    { itemId: "naga-scale", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "venom-gland", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
