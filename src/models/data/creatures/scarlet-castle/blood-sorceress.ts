import type { Creature } from "../types";

// Feiticeira de Sangue (NV. 841 a 850) da área Castelo Escarlate.
export const bloodSorceress: Creature = {
  id: "blood-sorceress",
  name: "Feiticeira de Sangue",
  image: "/assets/creatures/scarlet-castle/blood-sorceress.png",
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
    { itemId: "blood-grimoire", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "black-blood", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
