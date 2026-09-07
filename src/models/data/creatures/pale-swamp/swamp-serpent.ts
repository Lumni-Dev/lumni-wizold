import type { Creature } from "../types";

export const swampSerpent: Creature = {
  id: "swamp-serpent",
  name: "Swamp Serpent",
  description: "They do not breathe, do not tire, and already know the taste of your blood.",
  species: "vampire",
  level: 331,
  health: 3477,
  strength: 50,
  endurance: 564,
  agility: 224,
  experience: 2364,
  minBronze: 7,
  maxBronze: 13,
  drops: [
    { itemId: "serpent-scale", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "venom-gland", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
