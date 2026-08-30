import type { Creature } from "../types";

// Chacal Faminto (NV. 531 a 540) da área Ermo Cinza.
export const starvingJackal: Creature = {
  id: "starving-jackal",
  name: "Chacal Faminto",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 531,
  health: 6878,
  strength: 1115,
  endurance: 735,
  agility: 326,
  experience: 3764,
  minBronze: 777,
  maxBronze: 1443,
  drops: [
    { itemId: "chipped-antler", chance: 0.21, minimum: 1, maximum: 2 },
    { itemId: "deer-hide", chance: 0.112, minimum: 1, maximum: 2 },
  ],
};
