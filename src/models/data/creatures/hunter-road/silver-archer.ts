import type { Creature } from "../types";

export const silverArcher: Creature = {
  id: "silver-archer",
  name: "Silver Archer",
  description: "They do not breathe, do not tire, and already know the taste of your blood.",
  species: "vampire",
  level: 431,
  health: 9790,
  strength: 73,
  endurance: 1195,
  agility: 289,
  experience: 3064,
  minBronze: 8,
  maxBronze: 16,
  drops: [
    { itemId: "silver-arrow", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "silver-charm", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
