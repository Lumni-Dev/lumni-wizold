import type { Creature } from "../types";

export const royalEagle: Creature = {
  id: "royal-eagle",
  name: "Royal Eagle",
  description: "They do not breathe, do not tire, and already know the taste of your blood.",
  species: "vampire",
  level: 211,
  health: 1677,
  strength: 34,
  endurance: 272,
  agility: 146,
  experience: 1524,
  minBronze: 5,
  maxBronze: 9,
  drops: [
    { itemId: "eagle-feather", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "eagle-talon", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
