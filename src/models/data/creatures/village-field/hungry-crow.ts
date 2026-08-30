import type { Creature } from "../types";

// Corvo Faminto (NV. 41 a 50) da área Campo do Vilarejo.
export const hungryCrow: Creature = {
  id: "hungry-crow",
  name: "Corvo Faminto",
  image: "/assets/creatures/village-field/hungry-crow.png",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 41,
  health: 113,
  strength: 20,
  endurance: 14,
  agility: 32,
  experience: 334,
  minBronze: 21,
  maxBronze: 39,
  drops: [
    { itemId: "black-feather", chance: 0.35, minimum: 1, maximum: 2 },
    { itemId: "crow-beak", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
