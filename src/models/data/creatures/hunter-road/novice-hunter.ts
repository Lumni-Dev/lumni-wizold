import type { Creature } from "../types";

// Caçador Novato (NV. 401 a 410) da área Estrada dos Caçadores.
export const noviceHunter: Creature = {
  id: "novice-hunter",
  name: "Caçador Novato",
  image: "",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 401,
  health: 1517,
  strength: 329,
  endurance: 246,
  agility: 207,
  experience: 2854,
  minBronze: 266,
  maxBronze: 495,
  drops: [
    { itemId: "twisted-steel", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "stolen-charm", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
