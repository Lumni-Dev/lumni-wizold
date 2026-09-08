import type { Creature } from "../types";

export const elderDragon: Creature = {
  id: "elder-dragon",
  name: "Elder Dragon",
  description: "Territorial and slow to give up. One blow is enough to crack a rib.",
  species: "bear",
  level: 961,
  health: 475608,
  strength: 474,
  endurance: 60517,
  agility: 341,
  experience: 6774,
  minBronze: 15,
  maxBronze: 29,
  drops: [
    { itemId: "dragon-scale", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "dragon-heart", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
