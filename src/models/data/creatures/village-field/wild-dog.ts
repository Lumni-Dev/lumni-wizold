import type { Creature } from "../types";

// Cão Selvagem (NV. 51 a 60) da área Campo do Vilarejo.
export const wildDog: Creature = {
  id: "wild-dog",
  name: "Cão Selvagem",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 51,
  health: 171,
  strength: 29,
  endurance: 17,
  agility: 38,
  experience: 404,
  minBronze: 25,
  maxBronze: 46,
  drops: [
    { itemId: "chipped-antler", chance: 0.21, minimum: 1, maximum: 2 },
    { itemId: "deer-hide", chance: 0.112, minimum: 1, maximum: 2 },
  ],
};
