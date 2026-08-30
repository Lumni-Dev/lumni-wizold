import type { Creature } from "../types";

// Esfinge (NV. 951 a 960) da área Clareira Branca.
export const sphinx: Creature = {
  id: "sphinx",
  name: "Esfinge",
  image: "/assets/creatures/white-clearing/sphinx.png",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 951,
  health: 16550,
  strength: 3335,
  endurance: 2696,
  agility: 482,
  experience: 6704,
  minBronze: 2221,
  maxBronze: 4125,
  drops: [
    { itemId: "sphinx-riddle", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "golden-fur", chance: 0.07, minimum: 1, maximum: 1 },
  ],
};
