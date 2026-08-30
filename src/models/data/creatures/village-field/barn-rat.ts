import type { Creature } from "../types";

// Rato de Celeiro (NV. 11 a 20) da área Campo do Vilarejo.
export const barnRat: Creature = {
  id: "barn-rat",
  name: "Rato de Celeiro",
  image: "",
  description: "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
  species: "rabbit",
  level: 11,
  health: 51,
  strength: 8,
  endurance: 5,
  agility: 17,
  experience: 124,
  minBronze: 11,
  maxBronze: 20,
  drops: [
    { itemId: "soft-fur", chance: 0.225, minimum: 1, maximum: 2 },
    { itemId: "lucky-foot", chance: 0.112, minimum: 1, maximum: 2 },
  ],
};
