import type { Creature } from "../types";

export const basilisk: Creature = {
  id: "basilisk",
  name: "Basilisk",
  description: "They do not breathe, do not tire, and already know the taste of your blood.",
  species: "vampire",
  level: 581,
  health: 22044,
  strength: 111,
  endurance: 2691,
  agility: 386,
  experience: 4114,
  minBronze: 11,
  maxBronze: 20,
  drops: [
    { itemId: "basilisk-fang", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "basilisk-scale", chance: 0.07, minimum: 1, maximum: 1 },
  ],
};
