import type { Creature } from "../types";

export const mudGator: Creature = {
  id: "mud-gator",
  name: "Mud Alligator",
  description: "Territorial and slow to give up. One blow is enough to crack a rib.",
  species: "bear",
  level: 311,
  health: 3353,
  strength: 44,
  endurance: 567,
  agility: 113,
  experience: 2224,
  minBronze: 6,
  maxBronze: 12,
  drops: [
    { itemId: "gator-scale", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "gator-tooth", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
