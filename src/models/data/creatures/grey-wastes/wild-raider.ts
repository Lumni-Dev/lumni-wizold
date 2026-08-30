import type { Creature } from "../types";

// Saqueador Selvagem (NV. 551 a 560) da área Ermo Cinza.
export const wildRaider: Creature = {
  id: "wild-raider",
  name: "Saqueador Selvagem",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 551,
  health: 6574,
  strength: 1292,
  endurance: 820,
  agility: 282,
  experience: 3904,
  minBronze: 784,
  maxBronze: 1455,
  drops: [
    { itemId: "twisted-steel", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "stolen-charm", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
