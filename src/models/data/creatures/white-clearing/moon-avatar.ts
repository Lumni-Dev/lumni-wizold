import type { Creature } from "../types";

export const moonAvatar: Creature = {
  id: "moon-avatar",
  name: "Avatar of the Moon",
  description: "Nothing here is gentle. The horn runs you through before you hear the gallop.",
  species: "unicorn",
  level: 991,
  health: 520225,
  strength: 526,
  endurance: 68322,
  agility: 552,
  experience: 6984,
  minBronze: 16,
  maxBronze: 30,
  drops: [
    { itemId: "moon-essence", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "silver-mane", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
