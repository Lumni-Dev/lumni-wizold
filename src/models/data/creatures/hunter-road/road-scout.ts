import type { Creature } from "../types";

// Batedor da Estrada (NV. 411 a 420) da área Estrada dos Caçadores.
export const roadScout: Creature = {
  id: "road-scout",
  name: "Batedor da Estrada",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 411,
  health: 2259,
  strength: 388,
  endurance: 240,
  agility: 254,
  experience: 2924,
  minBronze: 270,
  maxBronze: 502,
  drops: [
    { itemId: "chipped-antler", chance: 0.21, minimum: 1, maximum: 2 },
    { itemId: "deer-hide", chance: 0.112, minimum: 1, maximum: 2 },
  ],
};
