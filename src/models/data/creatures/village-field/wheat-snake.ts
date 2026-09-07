import type { Creature } from "../types";

export const wheatSnake: Creature = {
  id: "wheat-snake",
  name: "Wheat Snake",
  description: "They do not breathe, do not tire, and already know the taste of your blood.",
  species: "vampire",
  level: 71,
  health: 588,
  strength: 20,
  endurance: 95,
  agility: 55,
  experience: 544,
  minBronze: 4,
  maxBronze: 7,
  drops: [
    { itemId: "snake-skin", chance: 0.35, minimum: 1, maximum: 2 },
    { itemId: "venom-gland", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
