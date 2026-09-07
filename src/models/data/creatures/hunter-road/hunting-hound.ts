import type { Creature } from "../types";

export const huntingHound: Creature = {
  id: "hunting-hound",
  name: "Hunting Hound",
  description: "They flee well and kick better. They feed a whole pack for weeks.",
  species: "deer",
  level: 441,
  health: 9058,
  strength: 66,
  endurance: 1164,
  agility: 272,
  experience: 3134,
  minBronze: 8,
  maxBronze: 16,
  drops: [
    { itemId: "canine-pelt", chance: 0.35, minimum: 1, maximum: 2 },
    { itemId: "sharp-fang", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
