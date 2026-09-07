import type { Creature } from "../types";

export const thiefFox: Creature = {
  id: "thief-fox",
  name: "Thief Fox",
  description: "They flee well and kick better. They feed a whole pack for weeks.",
  species: "deer",
  level: 31,
  health: 307,
  strength: 14,
  endurance: 52,
  agility: 26,
  experience: 264,
  minBronze: 3,
  maxBronze: 5,
  drops: [
    { itemId: "fox-pelt", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "sharp-fang", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
