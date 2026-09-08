import type { Creature } from "../types";

export const deadKnight: Creature = {
  id: "dead-knight",
  name: "Dead Knight",
  description: "Territorial and slow to give up. One blow is enough to crack a rib.",
  species: "bear",
  level: 641,
  health: 48400,
  strength: 150,
  endurance: 6159,
  agility: 229,
  experience: 4534,
  minBronze: 11,
  maxBronze: 21,
  drops: [
    { itemId: "cursed-plate", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "bone-shard", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
