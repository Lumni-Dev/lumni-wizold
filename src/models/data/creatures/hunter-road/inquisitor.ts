import type { Creature } from "../types";

// Inquisidor (NV. 471 a 480) da área Estrada dos Caçadores.
export const inquisitor: Creature = {
  id: "inquisitor",
  name: "Inquisidor",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 471,
  health: 5964,
  strength: 1165,
  endurance: 744,
  agility: 242,
  experience: 3344,
  minBronze: 756,
  maxBronze: 1404,
  drops: [
    { itemId: "twisted-steel", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "stolen-charm", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
