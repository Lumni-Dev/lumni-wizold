import type { Creature } from "../types";

export const elderVampire: Creature = {
  id: "elder-vampire",
  name: "Elder Vampire",
  description: "They do not breathe, do not tire, and already know the taste of your blood.",
  species: "vampire",
  level: 861,
  health: 257493,
  strength: 382,
  endurance: 31429,
  agility: 568,
  experience: 6074,
  minBronze: 14,
  maxBronze: 26,
  drops: [
    { itemId: "black-blood", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "empty-fang", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
