import type { Creature } from "../types";

export const mistBear: Creature = {
  id: "mist-bear",
  name: "Mist Bear",
  description: "Territorial and slow to give up. One blow is enough to crack a rib.",
  species: "bear",
  level: 221,
  health: 1925,
  strength: 33,
  endurance: 326,
  agility: 82,
  experience: 1594,
  minBronze: 6,
  maxBronze: 10,
  drops: [
    { itemId: "bear-pelt", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "bear-claw", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
