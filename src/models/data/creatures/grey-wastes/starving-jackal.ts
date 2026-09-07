import type { Creature } from "../types";

export const starvingJackal: Creature = {
  id: "starving-jackal",
  name: "Starving Jackal",
  description: "They flee well and kick better. They feed a whole pack for weeks.",
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
