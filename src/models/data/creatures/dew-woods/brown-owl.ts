import type { Creature } from "../types";

export const brownOwl: Creature = {
  id: "brown-owl",
  name: "Coruja Parda",
  description: "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
  species: "rabbit",
  level: 111,
  health: 630,
  strength: 19,
  endurance: 79,
  agility: 87,
  experience: 824,
  minBronze: 4,
  maxBronze: 7,
  drops: [
    { itemId: "owl-feather", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "talon", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
