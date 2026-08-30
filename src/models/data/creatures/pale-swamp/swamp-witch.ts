import type { Creature } from "../types";

// Bruxa do Pântano (NV. 391 a 400) da área Pântano Pálido.
export const swampWitch: Creature = {
  id: "swamp-witch",
  name: "Bruxa do Pântano",
  image: "",
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
    { itemId: "twisted-steel", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "stolen-charm", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
