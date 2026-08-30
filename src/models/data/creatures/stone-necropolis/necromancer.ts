import type { Creature } from "../types";

// Necromante (NV. 661 a 670) da área Necrópole de Pedra.
export const necromancer: Creature = {
  id: "necromancer",
  name: "Necromante",
  image: "/assets/creatures/stone-necropolis/necromancer.png",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 661,
  health: 8386,
  strength: 1706,
  endurance: 1365,
  agility: 337,
  experience: 4674,
  minBronze: 1137,
  maxBronze: 2111,
  drops: [
    { itemId: "necro-tome", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "cursed-charm", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
