import type { Creature } from "../types";

// Raposa Ladra (NV. 31 a 40) da área Campo do Vilarejo.
export const thiefFox: Creature = {
  id: "thief-fox",
  name: "Raposa Ladra",
  image: "/assets/creatures/village-field/thief-fox.png",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 31,
  health: 307,
  strength: 14,
  endurance: 52,
  agility: 26,
  experience: 264,
  minBronze: 52,
  maxBronze: 96,
  drops: [
    { itemId: "fox-pelt", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "sharp-fang", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
