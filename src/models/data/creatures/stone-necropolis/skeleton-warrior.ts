import type { Creature } from "../types";

// Esqueleto Guerreiro (NV. 601 a 610) da área Necrópole de Pedra.
export const skeletonWarrior: Creature = {
  id: "skeleton-warrior",
  name: "Esqueleto Guerreiro",
  image: "/assets/creatures/stone-necropolis/skeleton-warrior.png",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 601,
  health: 5458,
  strength: 1123,
  endurance: 888,
  agility: 307,
  experience: 4254,
  minBronze: 801,
  maxBronze: 1487,
  drops: [
    { itemId: "bone-shard", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "rusted-blade", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
