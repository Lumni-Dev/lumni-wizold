import type { Creature } from "../types";

export const starvingPack: Creature = {
  id: "starving-pack",
  name: "Alcateia Faminta",
  image: "/assets/creatures/dew-woods/starving-pack.png",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 191,
  health: 1087,
  strength: 28,
  endurance: 217,
  agility: 102,
  experience: 1384,
  minBronze: 117,
  maxBronze: 217,
  drops: [
    { itemId: "wolf-pelt", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "wolf-fang", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
