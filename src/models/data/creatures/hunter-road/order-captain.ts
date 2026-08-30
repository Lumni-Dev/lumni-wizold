import type { Creature } from "../types";

// Capitão da Ordem (NV. 481 a 490) da área Estrada dos Caçadores.
export const orderCaptain: Creature = {
  id: "order-captain",
  name: "Capitão da Ordem",
  image: "",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 481,
  health: 4588,
  strength: 936,
  endurance: 746,
  agility: 247,
  experience: 3414,
  minBronze: 759,
  maxBronze: 1410,
  drops: [
    { itemId: "twisted-steel", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "stolen-charm", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
