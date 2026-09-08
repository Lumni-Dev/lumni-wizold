import type { Creature } from "../types";

export const fierceBoar: Creature = {
  id: "fierce-boar",
  name: "Fierce Boar",
  description: "Territorial and slow to give up. One blow is enough to crack a rib.",
  species: "bear",
  level: 61,
  health: 556,
  strength: 18,
  endurance: 94,
  agility: 26,
  experience: 474,
  minBronze: 3,
  maxBronze: 5,
  drops: [
    { itemId: "boar-tusk", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "thick-hide", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
