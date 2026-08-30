import type { Creature } from "../types";

// Saqueador Selvagem (NV. 551 a 560) da área Ermo Cinza.
export const wildRaider: Creature = {
  id: "wild-raider",
  name: "Saqueador Selvagem",
  image: "/assets/creatures/grey-wastes/wild-raider.png",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 551,
  health: 16758,
  strength: 100,
  endurance: 2511,
  agility: 282,
  experience: 3904,
  minBronze: 587,
  maxBronze: 1089,
  drops: [
    { itemId: "raider-loot", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "coin-purse", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
