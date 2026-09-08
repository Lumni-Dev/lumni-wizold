import type { Creature } from "../types";

export const caveDragon: Creature = {
  id: "cave-dragon",
  name: "Cave Dragon",
  description: "Territorial and slow to give up. One blow is enough to crack a rib.",
  species: "bear",
  level: 791,
  health: 110226,
  strength: 228,
  endurance: 14026,
  agility: 281,
  experience: 5584,
  minBronze: 13,
  maxBronze: 25,
  drops: [
    { itemId: "dragon-scale", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "dragon-fang", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
