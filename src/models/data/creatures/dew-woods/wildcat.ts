import type { Creature } from "../types";

export const wildcat: Creature = {
  id: "wildcat",
  name: "Wildcat",
  description: "They do not breathe, do not tire, and already know the taste of your blood.",
  species: "vampire",
  level: 161,
  health: 1098,
  strength: 27,
  endurance: 178,
  agility: 113,
  experience: 1174,
  minBronze: 4,
  maxBronze: 8,
  drops: [
    { itemId: "wildcat-pelt", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "sharp-fang", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
