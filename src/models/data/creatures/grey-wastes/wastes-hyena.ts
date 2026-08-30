import type { Creature } from "../types";

// Hiena do Ermo (NV. 511 a 520) da área Ermo Cinza.
export const wastesHyena: Creature = {
  id: "wastes-hyena",
  name: "Hiena do Ermo",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 511,
  health: 6826,
  strength: 1105,
  endurance: 730,
  agility: 314,
  experience: 3624,
  minBronze: 770,
  maxBronze: 1430,
  drops: [
    { itemId: "chipped-antler", chance: 0.21, minimum: 1, maximum: 2 },
    { itemId: "deer-hide", chance: 0.112, minimum: 1, maximum: 2 },
  ],
};
