import type { Creature } from "../types";

// Enxame de Mosquitos (NV. 351 a 360) da área Pântano Pálido.
export const mosquitoSwarm: Creature = {
  id: "mosquito-swarm",
  name: "Enxame de Mosquitos",
  description: "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
  species: "rabbit",
  level: 351,
  health: 1599,
  strength: 287,
  endurance: 142,
  agility: 255,
  experience: 2504,
  minBronze: 249,
  maxBronze: 463,
  drops: [
    { itemId: "soft-fur", chance: 0.225, minimum: 1, maximum: 2 },
    { itemId: "lucky-foot", chance: 0.112, minimum: 1, maximum: 2 },
  ],
};
