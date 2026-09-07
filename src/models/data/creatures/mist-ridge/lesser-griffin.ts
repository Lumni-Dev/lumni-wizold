import type { Creature } from "../types";

export const lesserGriffin: Creature = {
  id: "lesser-griffin",
  name: "Lesser Griffin",
  description: "Nothing here is gentle. The horn runs you through before you hear the gallop.",
  species: "unicorn",
  level: 291,
  health: 2939,
  strength: 44,
  endurance: 514,
  agility: 167,
  experience: 2084,
  minBronze: 6,
  maxBronze: 12,
  drops: [
    { itemId: "griffin-feather", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "eagle-talon", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
