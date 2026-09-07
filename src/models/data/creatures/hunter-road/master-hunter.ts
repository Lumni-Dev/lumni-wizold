import type { Creature } from "../types";

export const masterHunter: Creature = {
  id: "master-hunter",
  name: "Master Hunter",
  description: "They do not breathe, do not tire, and already know the taste of your blood.",
  species: "vampire",
  level: 491,
  health: 14686,
  strength: 90,
  endurance: 1792,
  agility: 328,
  experience: 3484,
  minBronze: 9,
  maxBronze: 17,
  drops: [
    { itemId: "master-trophy", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "silver-charm", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
