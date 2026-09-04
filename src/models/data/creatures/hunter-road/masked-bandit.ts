import type { Creature } from "../types";

export const maskedBandit: Creature = {
  id: "masked-bandit",
  name: "Bandido Mascarado",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 451,
  health: 9765,
  strength: 76,
  endurance: 1463,
  agility: 232,
  experience: 3204,
  minBronze: 8,
  maxBronze: 16,
  drops: [
    { itemId: "bandit-mask", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "coin-purse", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
