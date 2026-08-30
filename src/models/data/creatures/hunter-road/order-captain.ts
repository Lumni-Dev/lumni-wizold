import type { Creature } from "../types";

// Capitão da Ordem (NV. 481 a 490) da área Estrada dos Caçadores.
export const orderCaptain: Creature = {
  id: "order-captain",
  name: "Capitão da Ordem",
  image: "/assets/creatures/hunter-road/order-captain.png",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 481,
  health: 11861,
  strength: 84,
  endurance: 1777,
  agility: 247,
  experience: 3414,
  minBronze: 562,
  maxBronze: 1044,
  drops: [
    { itemId: "captain-medal", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "knight-plate", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
