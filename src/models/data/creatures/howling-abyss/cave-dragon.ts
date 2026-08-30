import type { Creature } from "../types";

// Dragão das Cavernas (NV. 791 a 800) da área Abismo Uivante.
export const caveDragon: Creature = {
  id: "cave-dragon",
  name: "Dragão das Cavernas",
  image: "/assets/creatures/howling-abyss/cave-dragon.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 791,
  health: 10954,
  strength: 1650,
  endurance: 1437,
  agility: 281,
  experience: 5584,
  minBronze: 1182,
  maxBronze: 2195,
  drops: [
    { itemId: "dragon-scale", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "dragon-fang", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
