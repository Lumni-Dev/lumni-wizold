import type { Creature } from "../types";

// Lobo da Neve (NV. 271 a 280) da área Serra das Brumas.
export const snowWolf: Creature = {
  id: "snow-wolf",
  name: "Lobo da Neve",
  image: "/assets/creatures/mist-ridge/snow-wolf.png",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 271,
  health: 1361,
  strength: 238,
  endurance: 189,
  agility: 170,
  experience: 1944,
  minBronze: 222,
  maxBronze: 412,
  drops: [
    { itemId: "snow-pelt", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "wolf-fang", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
