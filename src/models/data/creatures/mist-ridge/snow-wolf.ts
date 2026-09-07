import type { Creature } from "../types";

export const snowWolf: Creature = {
  id: "snow-wolf",
  name: "Snow Wolf",
  description: "They flee well and kick better. They feed a whole pack for weeks.",
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
