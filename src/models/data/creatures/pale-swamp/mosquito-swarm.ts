import type { Creature } from "../types";

export const mosquitoSwarm: Creature = {
  id: "mosquito-swarm",
  name: "Enxame de Mosquitos",
  description: "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
  species: "rabbit",
  level: 351,
  health: 2912,
  strength: 41,
  endurance: 368,
  agility: 255,
  experience: 2504,
  minBronze: 7,
  maxBronze: 13,
  drops: [
    { itemId: "mosquito-wing", chance: 0.35, minimum: 1, maximum: 2 },
    { itemId: "venom-gland", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
