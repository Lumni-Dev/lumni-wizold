import type { Creature } from "../types";

// Dragão das Cavernas (NV. 791 a 800) da área Abismo Uivante.
export const caveDragon: Creature = {
  id: "cave-dragon",
  name: "Dragão das Cavernas",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 791,
  health: 14288,
  strength: 2063,
  endurance: 1437,
  agility: 281,
  experience: 5584,
  minBronze: 1182,
  maxBronze: 2195,
  drops: [
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
