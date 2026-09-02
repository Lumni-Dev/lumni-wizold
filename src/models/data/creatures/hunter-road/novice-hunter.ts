import type { Creature } from "../types";

// Caçador Novato (NV. 401 a 410) da área Estrada dos Caçadores.
export const noviceHunter: Creature = {
  id: "novice-hunter",
  name: "Caçador Novato",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 401,
  health: 6269,
  strength: 60,
  endurance: 940,
  agility: 207,
  experience: 2854,
  minBronze: 8,
  maxBronze: 14,
  drops: [
    { itemId: "steel-scrap", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "coin-purse", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
