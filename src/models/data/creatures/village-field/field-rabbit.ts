import type { Creature } from "../types";

// Coelho do Campo (NV. 1 a 10) da área Campo do Vilarejo.
export const fieldRabbit: Creature = {
  id: "field-rabbit",
  name: "Coelho do Campo",
  image: "",
  description: "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
  species: "rabbit",
  level: 1,
  health: 39,
  strength: 6,
  endurance: 4,
  agility: 10,
  experience: 54,
  minBronze: 8,
  maxBronze: 14,
  drops: [
    { itemId: "soft-fur", chance: 0.225, minimum: 1, maximum: 2 },
    { itemId: "lucky-foot", chance: 0.112, minimum: 1, maximum: 2 },
  ],
};
