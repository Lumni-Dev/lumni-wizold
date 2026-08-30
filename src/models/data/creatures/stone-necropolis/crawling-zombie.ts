import type { Creature } from "../types";

// Zumbi Rastejante (NV. 611 a 620) da área Necrópole de Pedra.
export const crawlingZombie: Creature = {
  id: "crawling-zombie",
  name: "Zumbi Rastejante",
  image: "/assets/creatures/stone-necropolis/crawling-zombie.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 611,
  health: 7414,
  strength: 1123,
  endurance: 972,
  agility: 218,
  experience: 4324,
  minBronze: 805,
  maxBronze: 1494,
  drops: [
    { itemId: "rotten-flesh", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "grave-dirt", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
