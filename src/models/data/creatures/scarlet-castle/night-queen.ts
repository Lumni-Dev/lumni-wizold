import type { Creature } from "../types";

export const nightQueen: Creature = {
  id: "night-queen",
  name: "Queen of the Night",
  description: "Nothing here is gentle. The horn runs you through before you hear the gallop.",
  species: "unicorn",
  level: 891,
  health: 322281,
  strength: 414,
  endurance: 42325,
  agility: 497,
  experience: 6284,
  minBronze: 15,
  maxBronze: 27,
  drops: [
    { itemId: "queen-tiara", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "black-blood", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
