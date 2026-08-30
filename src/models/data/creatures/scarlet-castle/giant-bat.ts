import type { Creature } from "../types";

// Morcego Gigante (NV. 811 a 820) da área Castelo Escarlate.
export const giantBat: Creature = {
  id: "giant-bat",
  name: "Morcego Gigante",
  description: "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
  species: "rabbit",
  level: 811,
  health: 7994,
  strength: 1365,
  endurance: 713,
  agility: 577,
  experience: 5724,
  minBronze: 1189,
  maxBronze: 2208,
  drops: [
    { itemId: "soft-fur", chance: 0.225, minimum: 1, maximum: 2 },
    { itemId: "lucky-foot", chance: 0.112, minimum: 1, maximum: 2 },
  ],
};
