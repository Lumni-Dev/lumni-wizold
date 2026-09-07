import type { Creature } from "../types";

export const giantScorpion: Creature = {
  id: "giant-scorpion",
  name: "Giant Scorpion",
  description: "They do not breathe, do not tire, and already know the taste of your blood.",
  species: "vampire",
  level: 521,
  health: 17133,
  strength: 97,
  endurance: 2092,
  agility: 347,
  experience: 3694,
  minBronze: 10,
  maxBronze: 18,
  drops: [
    { itemId: "scorpion-stinger", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "chitin-plate", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
