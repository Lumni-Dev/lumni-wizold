import type { Creature } from "../types";

export const necromancer: Creature = {
  id: "necromancer",
  name: "Necromante",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 661,
  health: 45943,
  strength: 167,
  endurance: 6884,
  agility: 337,
  experience: 4674,
  minBronze: 11,
  maxBronze: 21,
  drops: [
    { itemId: "necro-tome", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "cursed-charm", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
