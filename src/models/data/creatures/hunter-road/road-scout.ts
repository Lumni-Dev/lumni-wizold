import type { Creature } from "../types";

export const roadScout: Creature = {
  id: "road-scout",
  name: "Road Scout",
  description: "They flee well and kick better. They feed a whole pack for weeks.",
  species: "deer",
  level: 411,
  health: 6963,
  strength: 58,
  endurance: 895,
  agility: 254,
  experience: 2924,
  minBronze: 8,
  maxBronze: 14,
  drops: [
    { itemId: "leather-strap", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "scout-map", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
