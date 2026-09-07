import type { Creature } from "../types";

export const giantSpider: Creature = {
  id: "giant-spider",
  name: "Giant Spider",
  description: "They do not breathe, do not tire, and already know the taste of your blood.",
  species: "vampire",
  level: 181,
  health: 1211,
  strength: 29,
  endurance: 197,
  agility: 126,
  experience: 1314,
  minBronze: 5,
  maxBronze: 9,
  drops: [
    { itemId: "spider-silk", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "venom-gland", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
