import type { Creature } from "../types";

export const sandWorm: Creature = {
  id: "sand-worm",
  name: "Sand Worm",
  description: "Territorial and slow to give up. One blow is enough to crack a rib.",
  species: "bear",
  level: 541,
  health: 19814,
  strength: 96,
  endurance: 2521,
  agility: 194,
  experience: 3834,
  minBronze: 10,
  maxBronze: 18,
  drops: [
    { itemId: "worm-hide", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "sand-tooth", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
