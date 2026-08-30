import type { Creature } from "../types";

// Necromante (NV. 661 a 670) da área Necrópole de Pedra.
export const necromancer: Creature = {
  id: "necromancer",
  name: "Necromante",
  description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
  species: "human",
  level: 661,
  health: 10939,
  strength: 2133,
  endurance: 1365,
  agility: 337,
  experience: 4674,
  minBronze: 1137,
  maxBronze: 2111,
  drops: [
    { itemId: "twisted-steel", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "stolen-charm", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
