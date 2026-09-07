import type { Creature } from "../types";

export const pegasus: Creature = {
  id: "pegasus",
  name: "Pegasus",
  description: "Nothing here is gentle. The horn runs you through before you hear the gallop.",
  species: "unicorn",
  level: 941,
  health: 421444,
  strength: 473,
  endurance: 55349,
  agility: 525,
  experience: 6634,
  minBronze: 15,
  maxBronze: 29,
  drops: [
    { itemId: "pegasus-feather", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "silver-mane", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
