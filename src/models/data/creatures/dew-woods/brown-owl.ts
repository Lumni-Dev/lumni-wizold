import type { Creature } from "../types";

// Coruja Parda (NV. 111 a 120) da área Mata do Orvalho.
export const brownOwl: Creature = {
  id: "brown-owl",
  name: "Coruja Parda",
  description: "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
  species: "rabbit",
  level: 111,
  health: 261,
  strength: 49,
  endurance: 22,
  agility: 87,
  experience: 824,
  minBronze: 45,
  maxBronze: 84,
  drops: [
    { itemId: "soft-fur", chance: 0.225, minimum: 1, maximum: 2 },
    { itemId: "lucky-foot", chance: 0.112, minimum: 1, maximum: 2 },
  ],
};
