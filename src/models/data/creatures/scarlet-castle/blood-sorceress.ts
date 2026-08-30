import type { Creature } from "../types";

export const bloodSorceress: Creature = {
  id: "blood-sorceress",
  name: "Feiticeira de Sangue",
  image: "/assets/creatures/scarlet-castle/blood-sorceress.png",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 841,
  health: 186968,
  strength: 337,
  endurance: 28018,
  agility: 427,
  experience: 5934,
  minBronze: 481,
  maxBronze: 893,
  drops: [
    { itemId: "blood-grimoire", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "black-blood", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
