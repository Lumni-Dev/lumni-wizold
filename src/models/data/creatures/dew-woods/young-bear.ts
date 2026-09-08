import type { Creature } from "../types";

export const youngBear: Creature = {
  id: "young-bear",
  name: "Young Brown Bear",
  description: "Territorial and slow to give up. One blow is enough to crack a rib.",
  species: "bear",
  level: 151,
  health: 1102,
  strength: 25,
  endurance: 186,
  agility: 57,
  experience: 1104,
  minBronze: 4,
  maxBronze: 8,
  drops: [
    { itemId: "bear-pelt", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "bear-claw", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
