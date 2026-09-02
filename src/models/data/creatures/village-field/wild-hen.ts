import type { Creature } from "../types";

// Galinha do Mato (NV. 21 a 30) da área Campo do Vilarejo.
export const wildHen: Creature = {
  id: "wild-hen",
  name: "Galinha do Mato",
  description: "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
  species: "rabbit",
  level: 21,
  health: 230,
  strength: 12,
  endurance: 29,
  agility: 24,
  experience: 194,
  minBronze: 3,
  maxBronze: 5,
  drops: [
    { itemId: "feather", chance: 0.35, minimum: 1, maximum: 2 },
    { itemId: "poultry-meat", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
