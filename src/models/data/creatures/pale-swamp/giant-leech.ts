import type { Creature } from "../types";

export const giantLeech: Creature = {
  id: "giant-leech",
  name: "Giant Leech",
  description: "They do not breathe, do not tire, and already know the taste of your blood.",
  species: "vampire",
  level: 321,
  health: 3322,
  strength: 48,
  endurance: 540,
  agility: 217,
  experience: 2294,
  minBronze: 7,
  maxBronze: 13,
  drops: [
    { itemId: "leech-blood", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "venom-gland", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
