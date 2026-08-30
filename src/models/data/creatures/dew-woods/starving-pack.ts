import type { Creature } from "../types";

// Alcateia Faminta (NV. 191 a 200) da área Mata do Orvalho.
export const starvingPack: Creature = {
  id: "starving-pack",
  name: "Alcateia Faminta",
  image: "/assets/creatures/dew-woods/starving-pack.png",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 191,
  health: 388,
  strength: 90,
  endurance: 62,
  agility: 102,
  experience: 1384,
  minBronze: 73,
  maxBronze: 136,
  drops: [
    { itemId: "wolf-pelt", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "wolf-fang", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
