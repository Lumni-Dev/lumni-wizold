import type { Creature } from "../types";

export const skeletonWarrior: Creature = {
  id: "skeleton-warrior",
  name: "Warrior Skeleton",
  description: "Hunters, mercenaries and fanatics. They come with silver, fire and method.",
  species: "human",
  level: 601,
  health: 25872,
  strength: 125,
  endurance: 3877,
  agility: 307,
  experience: 4254,
  minBronze: 11,
  maxBronze: 20,
  drops: [
    { itemId: "bone-shard", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "rusted-blade", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
