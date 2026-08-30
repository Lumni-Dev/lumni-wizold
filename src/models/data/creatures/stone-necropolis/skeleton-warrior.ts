import type { Creature } from "../types";

// Esqueleto Guerreiro (NV. 601 a 610) da área Necrópole de Pedra.
export const skeletonWarrior: Creature = {
  id: "skeleton-warrior",
  name: "Esqueleto Guerreiro",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 601,
  health: 7119,
  strength: 1404,
  endurance: 888,
  agility: 307,
  experience: 4254,
  minBronze: 801,
  maxBronze: 1487,
  drops: [
    { itemId: "twisted-steel", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "stolen-charm", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
