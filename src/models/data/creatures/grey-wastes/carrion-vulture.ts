import type { Creature } from "../types";

// Abutre Carniceiro (NV. 501 a 510) da área Ermo Cinza.
export const carrionVulture: Creature = {
  id: "carrion-vulture",
  name: "Abutre Carniceiro",
  image: "/assets/creatures/grey-wastes/carrion-vulture.png",
  description: "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
  species: "rabbit",
  level: 501,
  health: 3961,
  strength: 704,
  endurance: 460,
  agility: 360,
  experience: 3554,
  minBronze: 766,
  maxBronze: 1423,
  drops: [
    { itemId: "vulture-feather", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "carrion-meat", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
