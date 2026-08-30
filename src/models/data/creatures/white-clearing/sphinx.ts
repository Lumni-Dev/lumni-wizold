import type { Creature } from "../types";

// Esfinge (NV. 951 a 960) da área Clareira Branca.
export const sphinx: Creature = {
  id: "sphinx",
  name: "Esfinge",
  image: "",
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
    { itemId: "twisted-steel", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "stolen-charm", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
