import type { Creature } from "../types";

export const stoneGolem: Creature = {
  id: "stone-golem",
  name: "Stone Golem",
  description: "Territorial and slow to give up. One blow is enough to crack a rib.",
  species: "bear",
  level: 571,
  health: 22392,
  strength: 102,
  endurance: 2849,
  agility: 204,
  experience: 4044,
  minBronze: 11,
  maxBronze: 20,
  drops: [
    { itemId: "golem-core", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "stone-shard", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
