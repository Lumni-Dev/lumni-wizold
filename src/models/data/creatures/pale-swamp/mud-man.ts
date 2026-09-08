import type { Creature } from "../types";

export const mudMan: Creature = {
  id: "mud-man",
  name: "Mire Man",
  description: "Territorial and slow to give up. One blow is enough to crack a rib.",
  species: "bear",
  level: 361,
  health: 4138,
  strength: 49,
  endurance: 701,
  agility: 131,
  experience: 2574,
  minBronze: 7,
  maxBronze: 13,
  drops: [
    { itemId: "swamp-mud", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "thick-hide", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
