import type { Creature } from "../types";

export const wastesHyena: Creature = {
  id: "wastes-hyena",
  name: "Wasteland Hyena",
  description: "They flee well and kick better. They feed a whole pack for weeks.",
  species: "deer",
  level: 511,
  health: 13951,
  strength: 83,
  endurance: 1793,
  agility: 314,
  experience: 3624,
  minBronze: 9,
  maxBronze: 17,
  drops: [
    { itemId: "hyena-pelt", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "sharp-fang", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
