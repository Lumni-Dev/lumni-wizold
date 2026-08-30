import type { Creature } from "../types";

export const carrionVulture: Creature = {
  id: "carrion-vulture",
  name: "Abutre Carniceiro",
  image: "/assets/creatures/grey-wastes/carrion-vulture.png",
  description: "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
  species: "rabbit",
  level: 501,
  health: 11958,
  strength: 74,
  endurance: 1136,
  agility: 360,
  experience: 3554,
  minBronze: 291,
  maxBronze: 540,
  drops: [
    { itemId: "vulture-feather", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "carrion-meat", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
