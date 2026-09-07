import type { Creature } from "../types";

export const marshNaga: Creature = {
  id: "marsh-naga",
  name: "Marsh Naga",
  description: "They do not breathe, do not tire, and already know the taste of your blood.",
  species: "vampire",
  level: 371,
  health: 4074,
  strength: 54,
  endurance: 662,
  agility: 250,
  experience: 2644,
  minBronze: 8,
  maxBronze: 14,
  drops: [
    { itemId: "naga-scale", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "venom-gland", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
