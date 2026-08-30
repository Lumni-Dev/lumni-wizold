import type { Creature } from "../types";

export const skeletonWarrior: Creature = {
  id: "skeleton-warrior",
  name: "Esqueleto Guerreiro",
  image: "/assets/creatures/stone-necropolis/skeleton-warrior.png",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 601,
  health: 25872,
  strength: 125,
  endurance: 3877,
  agility: 307,
  experience: 4254,
  minBronze: 347,
  maxBronze: 644,
  drops: [
    { itemId: "bone-shard", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "rusted-blade", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
