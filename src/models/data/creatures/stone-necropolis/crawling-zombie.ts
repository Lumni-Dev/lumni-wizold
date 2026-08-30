import type { Creature } from "../types";

// Zumbi Rastejante (NV. 611 a 620) da área Necrópole de Pedra.
export const crawlingZombie: Creature = {
  id: "crawling-zombie",
  name: "Zumbi Rastejante",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 611,
  health: 9671,
  strength: 1404,
  endurance: 972,
  agility: 218,
  experience: 4324,
  minBronze: 805,
  maxBronze: 1494,
  drops: [
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
