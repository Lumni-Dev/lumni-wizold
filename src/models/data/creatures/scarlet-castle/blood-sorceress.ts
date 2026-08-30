import type { Creature } from "../types";

// Feiticeira de Sangue (NV. 841 a 850) da área Castelo Escarlate.
export const bloodSorceress: Creature = {
  id: "blood-sorceress",
  name: "Feiticeira de Sangue",
  image: "",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 841,
  health: 16312,
  strength: 3278,
  endurance: 2658,
  agility: 427,
  experience: 5934,
  minBronze: 2183,
  maxBronze: 4054,
  drops: [
    { itemId: "twisted-steel", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "stolen-charm", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
