import type { Creature } from "../types";

export const succubus: Creature = {
  id: "succubus",
  name: "Succubus",
  description: "They do not breathe, do not tire, and already know the taste of your blood.",
  species: "vampire",
  level: 751,
  health: 88844,
  strength: 224,
  endurance: 10844,
  agility: 497,
  experience: 5304,
  minBronze: 13,
  maxBronze: 23,
  drops: [
    { itemId: "succubus-wing", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "shadow-silk", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
