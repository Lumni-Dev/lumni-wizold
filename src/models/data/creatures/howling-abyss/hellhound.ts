import type { Creature } from "../types";

export const hellhound: Creature = {
  id: "hellhound",
  name: "Hellhound",
  description: "They do not breathe, do not tire, and already know the taste of your blood.",
  species: "vampire",
  level: 711,
  health: 73224,
  strength: 203,
  endurance: 8938,
  agility: 471,
  experience: 5024,
  minBronze: 12,
  maxBronze: 22,
  drops: [
    { itemId: "hellhound-fang", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "ember-pelt", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
