import type { Creature } from "../types";

// Esfinge (NV. 951 a 960) da área Clareira Branca.
export const sphinx: Creature = {
  id: "sphinx",
  name: "Esfinge",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 951,
  health: 369026,
  strength: 474,
  endurance: 55300,
  agility: 482,
  experience: 6704,
  minBronze: 15,
  maxBronze: 29,
  drops: [
    { itemId: "sphinx-riddle", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "golden-fur", chance: 0.07, minimum: 1, maximum: 1 },
  ],
};
