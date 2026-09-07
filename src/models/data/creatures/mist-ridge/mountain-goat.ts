import type { Creature } from "../types";

export const mountainGoat: Creature = {
  id: "mountain-goat",
  name: "Mountain Goat",
  description: "They flee well and kick better. They feed a whole pack for weeks.",
  species: "deer",
  level: 201,
  health: 1301,
  strength: 28,
  endurance: 223,
  agility: 128,
  experience: 1454,
  minBronze: 5,
  maxBronze: 9,
  drops: [
    { itemId: "goat-horn", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "thick-hide", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
