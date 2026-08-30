import type { Creature } from "../types";

// Veado Jovem (NV. 101 a 110) da área Mata do Orvalho.
export const youngDeer: Creature = {
  id: "young-deer",
  name: "Veado Jovem",
  image: "/assets/creatures/dew-woods/young-deer.png",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 101,
  health: 646,
  strength: 20,
  endurance: 110,
  agility: 68,
  experience: 754,
  minBronze: 125,
  maxBronze: 233,
  drops: [
    { itemId: "deer-hide", chance: 0.35, minimum: 1, maximum: 2 },
    { itemId: "soft-antler", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
