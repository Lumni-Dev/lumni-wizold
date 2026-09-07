import type { Creature } from "../types";

export const youngDeer: Creature = {
  id: "young-deer",
  name: "Young Deer",
  description: "They flee well and kick better. They feed a whole pack for weeks.",
  species: "deer",
  level: 101,
  health: 646,
  strength: 20,
  endurance: 110,
  agility: 68,
  experience: 754,
  minBronze: 4,
  maxBronze: 7,
  drops: [
    { itemId: "deer-hide", chance: 0.35, minimum: 1, maximum: 2 },
    { itemId: "soft-antler", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
