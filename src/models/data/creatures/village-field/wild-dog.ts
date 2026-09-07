import type { Creature } from "../types";

export const wildDog: Creature = {
  id: "wild-dog",
  name: "Wild Dog",
  description: "They flee well and kick better. They feed a whole pack for weeks.",
  species: "deer",
  level: 51,
  health: 404,
  strength: 16,
  endurance: 69,
  agility: 38,
  experience: 404,
  minBronze: 3,
  maxBronze: 5,
  drops: [
    { itemId: "canine-pelt", chance: 0.35, minimum: 1, maximum: 2 },
    { itemId: "sharp-fang", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
