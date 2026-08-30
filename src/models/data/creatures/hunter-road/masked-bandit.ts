import type { Creature } from "../types";

// Bandido Mascarado (NV. 451 a 460) da área Estrada dos Caçadores.
export const maskedBandit: Creature = {
  id: "masked-bandit",
  name: "Bandido Mascarado",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 451,
  health: 5918,
  strength: 1155,
  endurance: 738,
  agility: 232,
  experience: 3204,
  minBronze: 749,
  maxBronze: 1391,
  drops: [
    { itemId: "twisted-steel", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "stolen-charm", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
