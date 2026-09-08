import type { Creature } from "../types";

export const woodBoar: Creature = {
  id: "wood-boar",
  name: "Forest Boar",
  description: "Territorial and slow to give up. One blow is enough to crack a rib.",
  species: "bear",
  level: 131,
  health: 980,
  strength: 24,
  endurance: 166,
  agility: 50,
  experience: 964,
  minBronze: 4,
  maxBronze: 8,
  drops: [
    { itemId: "boar-tusk", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "thick-hide", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
