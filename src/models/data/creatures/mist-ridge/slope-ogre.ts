import type { Creature } from "../types";

export const slopeOgre: Creature = {
  id: "slope-ogre",
  name: "Hillside Ogre",
  description: "Territorial and slow to give up. One blow is enough to crack a rib.",
  species: "bear",
  level: 281,
  health: 2875,
  strength: 41,
  endurance: 486,
  agility: 103,
  experience: 2014,
  minBronze: 6,
  maxBronze: 12,
  drops: [
    { itemId: "ogre-tooth", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "thick-hide", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
