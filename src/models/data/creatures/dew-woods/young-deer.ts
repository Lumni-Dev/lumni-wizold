import type { Creature } from "../types";

// Veado Jovem (NV. 101 a 110) da área Mata do Orvalho.
export const youngDeer: Creature = {
  id: "young-deer",
  name: "Veado Jovem",
  image: "",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 101,
  health: 211,
  strength: 39,
  endurance: 28,
  agility: 68,
  experience: 754,
  minBronze: 42,
  maxBronze: 77,
  drops: [
    { itemId: "chipped-antler", chance: 0.21, minimum: 1, maximum: 2 },
    { itemId: "deer-hide", chance: 0.112, minimum: 1, maximum: 2 },
  ],
};
