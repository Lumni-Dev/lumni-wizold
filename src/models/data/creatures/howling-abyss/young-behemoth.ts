import type { Creature } from "../types";

export const youngBehemoth: Creature = {
  id: "young-behemoth",
  name: "Young Behemoth",
  description: "Territorial and slow to give up. One blow is enough to crack a rib.",
  species: "bear",
  level: 761,
  health: 97842,
  strength: 214,
  endurance: 12450,
  agility: 271,
  experience: 5374,
  minBronze: 13,
  maxBronze: 23,
  drops: [
    { itemId: "behemoth-hide", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "behemoth-horn", chance: 0.07, minimum: 1, maximum: 1 },
  ],
};
