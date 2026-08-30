import type { Creature } from "../types";

export const caveDragon: Creature = {
  id: "cave-dragon",
  name: "Dragão das Cavernas",
  image: "/assets/creatures/howling-abyss/cave-dragon.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 791,
  health: 110226,
  strength: 228,
  endurance: 14026,
  agility: 281,
  experience: 5584,
  minBronze: 453,
  maxBronze: 841,
  drops: [
    { itemId: "dragon-scale", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "dragon-fang", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
