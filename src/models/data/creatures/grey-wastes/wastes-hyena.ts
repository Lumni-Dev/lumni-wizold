import type { Creature } from "../types";

export const wastesHyena: Creature = {
  id: "wastes-hyena",
  name: "Hiena do Ermo",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
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
