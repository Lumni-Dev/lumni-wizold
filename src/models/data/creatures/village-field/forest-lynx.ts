import type { Creature } from "../types";

export const forestLynx: Creature = {
  id: "forest-lynx",
  name: "Forest Lynx",
  description: "They do not breathe, do not tire, and already know the taste of your blood.",
  species: "vampire",
  level: 91,
  health: 700,
  strength: 22,
  endurance: 114,
  agility: 68,
  experience: 684,
  minBronze: 4,
  maxBronze: 7,
  drops: [
    { itemId: "lynx-pelt", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "sharp-fang", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
