import type { Creature } from "../types";

// Chacal Faminto (NV. 531 a 540) da área Ermo Cinza.
export const starvingJackal: Creature = {
  id: "starving-jackal",
  name: "Chacal Faminto",
  image: "/assets/creatures/grey-wastes/starving-jackal.png",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 531,
  health: 5273,
  strength: 892,
  endurance: 735,
  agility: 326,
  experience: 3764,
  minBronze: 777,
  maxBronze: 1443,
  drops: [
    { itemId: "jackal-pelt", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "sharp-fang", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
