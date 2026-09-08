import type { Creature } from "../types";

export const armoredLizard: Creature = {
  id: "armored-lizard",
  name: "Armored Lizard",
  description: "Territorial and slow to give up. One blow is enough to crack a rib.",
  species: "bear",
  level: 341,
  health: 3825,
  strength: 48,
  endurance: 647,
  agility: 124,
  experience: 2434,
  minBronze: 7,
  maxBronze: 13,
  drops: [
    { itemId: "lizard-scale", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "thick-hide", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
