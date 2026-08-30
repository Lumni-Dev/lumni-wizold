import type { Creature } from "../types";

// Imp das Sombras (NV. 701 a 710) da área Abismo Uivante.
export const shadowImp: Creature = {
  id: "shadow-imp",
  name: "Imp das Sombras",
  image: "/assets/creatures/howling-abyss/shadow-imp.png",
  description: "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
  species: "rabbit",
  level: 701,
  health: 53464,
  strength: 158,
  endurance: 5078,
  agility: 500,
  experience: 4954,
  minBronze: 755,
  maxBronze: 1403,
  drops: [
    { itemId: "imp-horn", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "shadow-essence", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
