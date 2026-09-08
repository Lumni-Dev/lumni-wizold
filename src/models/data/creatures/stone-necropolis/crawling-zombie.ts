import type { Creature } from "../types";

export const crawlingZombie: Creature = {
  id: "crawling-zombie",
  name: "Crawling Zombie",
  description: "Territorial and slow to give up. One blow is enough to crack a rib.",
  species: "bear",
  level: 611,
  health: 36024,
  strength: 130,
  endurance: 4584,
  agility: 218,
  experience: 4324,
  minBronze: 11,
  maxBronze: 20,
  drops: [
    { itemId: "rotten-flesh", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "grave-dirt", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
