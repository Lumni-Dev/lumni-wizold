import type { Creature } from "../types";

// Senhor do Ermo (NV. 591 a 600) da área Ermo Cinza.
export const wastesLord: Creature = {
  id: "wastes-lord",
  name: "Senhor do Ermo",
  image: "/assets/creatures/grey-wastes/wastes-lord.png",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 591,
  health: 19553,
  strength: 108,
  endurance: 2930,
  agility: 302,
  experience: 4184,
  minBronze: 601,
  maxBronze: 1115,
  drops: [
    { itemId: "wastes-crown", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "coin-purse", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
