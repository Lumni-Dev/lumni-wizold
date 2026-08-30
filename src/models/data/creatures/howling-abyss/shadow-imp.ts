import type { Creature } from "../types";

// Imp das Sombras (NV. 701 a 710) da área Abismo Uivante.
export const shadowImp: Creature = {
  id: "shadow-imp",
  name: "Imp das Sombras",
  description: "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
  species: "rabbit",
  level: 701,
  health: 7776,
  strength: 1321,
  endurance: 693,
  agility: 500,
  experience: 4954,
  minBronze: 1150,
  maxBronze: 2136,
  drops: [
    { itemId: "soft-fur", chance: 0.225, minimum: 1, maximum: 2 },
    { itemId: "lucky-foot", chance: 0.112, minimum: 1, maximum: 2 },
  ],
};
