import type { Creature } from "../types";

// Sapo Venenoso (NV. 301 a 310) da área Pântano Pálido.
export const poisonToad: Creature = {
  id: "poison-toad",
  name: "Sapo Venenoso",
  image: "",
  description: "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
  species: "rabbit",
  level: 301,
  health: 1149,
  strength: 213,
  endurance: 133,
  agility: 220,
  experience: 2154,
  minBronze: 232,
  maxBronze: 431,
  drops: [
    { itemId: "soft-fur", chance: 0.225, minimum: 1, maximum: 2 },
    { itemId: "lucky-foot", chance: 0.112, minimum: 1, maximum: 2 },
  ],
};
