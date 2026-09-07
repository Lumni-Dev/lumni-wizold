import type { Creature } from "../types";

export const scarletCount: Creature = {
  id: "scarlet-count",
  name: "Scarlet Count",
  description: "Nothing here is gentle. The horn runs you through before you hear the gallop.",
  species: "unicorn",
  level: 881,
  health: 302601,
  strength: 401,
  endurance: 39740,
  agility: 492,
  experience: 6214,
  minBronze: 15,
  maxBronze: 27,
  drops: [
    { itemId: "count-crown", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "black-blood", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
