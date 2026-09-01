import type { Creature } from "../types";

// Lobo da Neve (NV. 271 a 280) da área Serra das Brumas.
export const snowWolf: Creature = {
  id: "snow-wolf",
  name: "Lobo da Neve",
  image: "/assets/creatures/mist-ridge/snow-wolf.png",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 271,
  health: 2201,
  strength: 37,
  endurance: 377,
  agility: 170,
  experience: 1944,
  minBronze: 6,
  maxBronze: 12,
  drops: [
    { itemId: "snow-pelt", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "wolf-fang", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
