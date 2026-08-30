import type { Creature } from "../types";

export const marshNaga: Creature = {
  id: "marsh-naga",
  name: "Naga do Charco",
  image: "/assets/creatures/pale-swamp/marsh-naga.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 371,
  health: 4074,
  strength: 54,
  endurance: 662,
  agility: 250,
  experience: 2644,
  minBronze: 218,
  maxBronze: 404,
  drops: [
    { itemId: "naga-scale", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "venom-gland", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
