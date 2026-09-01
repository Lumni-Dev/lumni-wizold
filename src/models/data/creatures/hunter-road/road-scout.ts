import type { Creature } from "../types";

// Batedor da Estrada (NV. 411 a 420) da área Estrada dos Caçadores.
export const roadScout: Creature = {
  id: "road-scout",
  name: "Batedor da Estrada",
  image: "/assets/creatures/hunter-road/road-scout.png",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 411,
  health: 6963,
  strength: 58,
  endurance: 895,
  agility: 254,
  experience: 2924,
  minBronze: 8,
  maxBronze: 14,
  drops: [
    { itemId: "leather-strap", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "scout-map", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
