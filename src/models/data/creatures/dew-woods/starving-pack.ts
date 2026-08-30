import type { Creature } from "../types";

// Alcateia Faminta (NV. 191 a 200) da área Mata do Orvalho.
export const starvingPack: Creature = {
  id: "starving-pack",
  name: "Alcateia Faminta",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 191,
  health: 506,
  strength: 113,
  endurance: 62,
  agility: 102,
  experience: 1384,
  minBronze: 73,
  maxBronze: 136,
  drops: [
    { itemId: "twisted-steel", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "stolen-charm", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
