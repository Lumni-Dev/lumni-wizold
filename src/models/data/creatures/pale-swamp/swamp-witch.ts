import type { Creature } from "../types";

// Bruxa do Pântano (NV. 391 a 400) da área Pântano Pálido.
export const swampWitch: Creature = {
  id: "swamp-witch",
  name: "Bruxa do Pântano",
  image: "/assets/creatures/pale-swamp/swamp-witch.png",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 391,
  health: 1501,
  strength: 325,
  endurance: 243,
  agility: 202,
  experience: 2784,
  minBronze: 263,
  maxBronze: 489,
  drops: [
    { itemId: "witch-hair", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "cursed-charm", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
