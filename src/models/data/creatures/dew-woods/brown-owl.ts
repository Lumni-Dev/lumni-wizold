import type { Creature } from "../types";

// Coruja Parda (NV. 111 a 120) da área Mata do Orvalho.
export const brownOwl: Creature = {
  id: "brown-owl",
  name: "Coruja Parda",
  image: "/assets/creatures/dew-woods/brown-owl.png",
  description: "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
  species: "rabbit",
  level: 111,
  health: 200,
  strength: 39,
  endurance: 22,
  agility: 87,
  experience: 824,
  minBronze: 45,
  maxBronze: 84,
  drops: [
    { itemId: "owl-feather", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "talon", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
