import type { Creature } from "../types";

export const nightNoble: Creature = {
  id: "night-noble",
  name: "Night Noble",
  description: "They do not breathe, do not tire, and already know the taste of your blood.",
  species: "vampire",
  level: 821,
  health: 180122,
  strength: 319,
  endurance: 21985,
  agility: 542,
  experience: 5794,
  minBronze: 14,
  maxBronze: 26,
  drops: [
    { itemId: "noble-signet", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "empty-fang", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
