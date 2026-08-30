import type { Creature } from "../types";

// Mercenário (NV. 421 a 430) da área Estrada dos Caçadores.
export const mercenary: Creature = {
  id: "mercenary",
  name: "Mercenário",
  image: "",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 421,
  health: 4483,
  strength: 911,
  endurance: 729,
  agility: 217,
  experience: 2994,
  minBronze: 738,
  maxBronze: 1371,
  drops: [
    { itemId: "twisted-steel", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "stolen-charm", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
