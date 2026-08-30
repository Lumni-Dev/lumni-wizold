import type { Creature } from "../types";

// Corvo Faminto (NV. 41 a 50) da área Campo do Vilarejo.
export const hungryCrow: Creature = {
  id: "hungry-crow",
  name: "Corvo Faminto",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 41,
  health: 147,
  strength: 25,
  endurance: 14,
  agility: 32,
  experience: 334,
  minBronze: 21,
  maxBronze: 39,
  drops: [
    { itemId: "chipped-antler", chance: 0.21, minimum: 1, maximum: 2 },
    { itemId: "deer-hide", chance: 0.112, minimum: 1, maximum: 2 },
  ],
};
