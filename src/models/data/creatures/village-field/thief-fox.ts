import type { Creature } from "../types";

// Raposa Ladra (NV. 31 a 40) da área Campo do Vilarejo.
export const thiefFox: Creature = {
  id: "thief-fox",
  name: "Raposa Ladra",
  image: "",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 31,
  health: 98,
  strength: 17,
  endurance: 12,
  agility: 26,
  experience: 264,
  minBronze: 18,
  maxBronze: 33,
  drops: [
    { itemId: "chipped-antler", chance: 0.21, minimum: 1, maximum: 2 },
    { itemId: "deer-hide", chance: 0.112, minimum: 1, maximum: 2 },
  ],
};
