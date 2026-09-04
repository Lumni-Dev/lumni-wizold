import type { Creature } from "../types";

export const hungryCrow: Creature = {
  id: "hungry-crow",
  name: "Corvo Faminto",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 41,
  health: 353,
  strength: 15,
  endurance: 60,
  agility: 32,
  experience: 334,
  minBronze: 3,
  maxBronze: 5,
  drops: [
    { itemId: "black-feather", chance: 0.35, minimum: 1, maximum: 2 },
    { itemId: "crow-beak", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
