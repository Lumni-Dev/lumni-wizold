import type { Creature } from "../types";

// Senhor do Ermo (NV. 591 a 600) da área Ermo Cinza.
export const wastesLord: Creature = {
  id: "wastes-lord",
  name: "Senhor do Ermo",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 591,
  health: 7011,
  strength: 1382,
  endurance: 875,
  agility: 302,
  experience: 4184,
  minBronze: 798,
  maxBronze: 1481,
  drops: [
    { itemId: "twisted-steel", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "stolen-charm", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
