import type { Creature } from "../types";

// Enxame de Mosquitos (NV. 351 a 360) da área Pântano Pálido.
export const mosquitoSwarm: Creature = {
  id: "mosquito-swarm",
  name: "Enxame de Mosquitos",
  image: "/assets/creatures/pale-swamp/mosquito-swarm.png",
  description: "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
  species: "rabbit",
  level: 351,
  health: 1226,
  strength: 229,
  endurance: 142,
  agility: 255,
  experience: 2504,
  minBronze: 249,
  maxBronze: 463,
  drops: [
    { itemId: "mosquito-wing", chance: 0.35, minimum: 1, maximum: 2 },
    { itemId: "venom-gland", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
