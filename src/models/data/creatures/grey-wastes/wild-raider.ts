import type { Creature } from "../types";

// Saqueador Selvagem (NV. 551 a 560) da área Ermo Cinza.
export const wildRaider: Creature = {
  id: "wild-raider",
  name: "Saqueador Selvagem",
  image: "/assets/creatures/grey-wastes/wild-raider.png",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 551,
  health: 5040,
  strength: 1034,
  endurance: 820,
  agility: 282,
  experience: 3904,
  minBronze: 784,
  maxBronze: 1455,
  drops: [
    { itemId: "raider-loot", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "coin-purse", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
