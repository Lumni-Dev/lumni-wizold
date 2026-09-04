import type { Creature } from "../types";

export const inquisitor: Creature = {
  id: "inquisitor",
  name: "Inquisidor",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 471,
  health: 11167,
  strength: 81,
  endurance: 1674,
  agility: 242,
  experience: 3344,
  minBronze: 9,
  maxBronze: 17,
  drops: [
    { itemId: "holy-water", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "silver-charm", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
