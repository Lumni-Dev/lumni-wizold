import type { Creature } from "../types";

export const greenSerpent: Creature = {
  id: "green-serpent",
  name: "Green Serpent",
  description: "They do not breathe, do not tire, and already know the taste of your blood.",
  species: "vampire",
  level: 141,
  health: 983,
  strength: 26,
  endurance: 160,
  agility: 100,
  experience: 1034,
  minBronze: 4,
  maxBronze: 8,
  drops: [
    { itemId: "serpent-scale", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "venom-gland", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
