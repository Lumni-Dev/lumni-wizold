import type { Creature } from "../types";

export const furiousBadger: Creature = {
  id: "furious-badger",
  name: "Furious Badger",
  description: "Territorial and slow to give up. One blow is enough to crack a rib.",
  species: "bear",
  level: 81,
  health: 677,
  strength: 20,
  endurance: 114,
  agility: 33,
  experience: 614,
  minBronze: 4,
  maxBronze: 7,
  drops: [
    { itemId: "badger-claw", chance: 0.35, minimum: 1, maximum: 2 },
    { itemId: "thick-hide", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
