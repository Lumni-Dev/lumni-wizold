import type { Creature } from "../types";

// Sapo Venenoso (NV. 301 a 310) da área Pântano Pálido.
export const poisonToad: Creature = {
  id: "poison-toad",
  name: "Sapo Venenoso",
  description: "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
  species: "rabbit",
  level: 301,
  health: 2331,
  strength: 37,
  endurance: 295,
  agility: 220,
  experience: 2154,
  minBronze: 6,
  maxBronze: 12,
  drops: [
    { itemId: "toad-skin", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "venom-gland", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
