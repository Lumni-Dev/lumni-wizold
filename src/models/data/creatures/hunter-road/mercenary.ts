import type { Creature } from "../types";

// Mercenário (NV. 421 a 430) da área Estrada dos Caçadores.
export const mercenary: Creature = {
  id: "mercenary",
  name: "Mercenário",
  image: "/assets/creatures/hunter-road/mercenary.png",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 421,
  health: 7674,
  strength: 67,
  endurance: 1150,
  agility: 217,
  experience: 2994,
  minBronze: 8,
  maxBronze: 16,
  drops: [
    { itemId: "steel-scrap", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "silver-charm", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
