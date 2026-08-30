import type { Creature } from "../types";

// Bandido Mascarado (NV. 451 a 460) da área Estrada dos Caçadores.
export const maskedBandit: Creature = {
  id: "masked-bandit",
  name: "Bandido Mascarado",
  image: "/assets/creatures/hunter-road/masked-bandit.png",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 451,
  health: 9765,
  strength: 76,
  endurance: 1463,
  agility: 232,
  experience: 3204,
  minBronze: 263,
  maxBronze: 488,
  drops: [
    { itemId: "bandit-mask", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "coin-purse", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
