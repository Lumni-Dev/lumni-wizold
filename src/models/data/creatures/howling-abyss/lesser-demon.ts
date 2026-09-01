import type { Creature } from "../types";

// Demônio Menor (NV. 721 a 730) da área Abismo Uivante.
export const lesserDemon: Creature = {
  id: "lesser-demon",
  name: "Demônio Menor",
  image: "/assets/creatures/howling-abyss/lesser-demon.png",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 721,
  health: 65945,
  strength: 200,
  endurance: 9882,
  agility: 367,
  experience: 5094,
  minBronze: 13,
  maxBronze: 23,
  drops: [
    { itemId: "demon-horn", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "brimstone", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
