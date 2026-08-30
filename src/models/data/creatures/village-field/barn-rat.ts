import type { Creature } from "../types";

// Rato de Celeiro (NV. 11 a 20) da área Campo do Vilarejo.
export const barnRat: Creature = {
  id: "barn-rat",
  name: "Rato de Celeiro",
  image: "/assets/creatures/village-field/barn-rat.png",
  description: "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
  species: "rabbit",
  level: 11,
  health: 188,
  strength: 11,
  endurance: 24,
  agility: 17,
  experience: 124,
  minBronze: 16,
  maxBronze: 30,
  drops: [
    { itemId: "rat-tail", chance: 0.35, minimum: 1, maximum: 2 },
    { itemId: "gnawed-bone", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
