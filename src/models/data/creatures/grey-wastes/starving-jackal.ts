import type { Creature } from "../types";

// Chacal Faminto (NV. 531 a 540) da área Ermo Cinza.
export const starvingJackal: Creature = {
  id: "starving-jackal",
  name: "Chacal Faminto",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 531,
  health: 15339,
  strength: 87,
  endurance: 1972,
  agility: 326,
  experience: 3764,
  minBronze: 10,
  maxBronze: 18,
  drops: [
    { itemId: "jackal-pelt", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "sharp-fang", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
