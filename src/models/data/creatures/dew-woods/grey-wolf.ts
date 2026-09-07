import type { Creature } from "../types";

export const greyWolf: Creature = {
  id: "grey-wolf",
  name: "Grey Wolf",
  description: "They flee well and kick better. They feed a whole pack for weeks.",
  species: "deer",
  level: 121,
  health: 743,
  strength: 21,
  endurance: 127,
  agility: 80,
  experience: 894,
  minBronze: 4,
  maxBronze: 8,
  drops: [
    { itemId: "wolf-pelt", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "wolf-fang", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
