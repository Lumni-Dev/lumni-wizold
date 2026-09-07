import type { Creature } from "../types";

export const brownOwl: Creature = {
  id: "brown-owl",
  name: "Brown Owl",
  description: "Small, fast and more numerous than they look. The first blood of any werewolf.",
  species: "rabbit",
  level: 111,
  health: 630,
  strength: 19,
  endurance: 79,
  agility: 87,
  experience: 824,
  minBronze: 4,
  maxBronze: 7,
  drops: [
    { itemId: "owl-feather", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "talon", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
