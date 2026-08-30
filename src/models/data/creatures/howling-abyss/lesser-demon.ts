import type { Creature } from "../types";

// Demônio Menor (NV. 721 a 730) da área Abismo Uivante.
export const lesserDemon: Creature = {
  id: "lesser-demon",
  name: "Demônio Menor",
  image: "",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 721,
  health: 8515,
  strength: 1738,
  endurance: 1386,
  agility: 367,
  experience: 5094,
  minBronze: 1157,
  maxBronze: 2149,
  drops: [
    { itemId: "twisted-steel", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "stolen-charm", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
