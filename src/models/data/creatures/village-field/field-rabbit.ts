import type { Creature } from "../types";

// Coelho do Campo (NV. 1 a 10) da área Campo do Vilarejo.
export const fieldRabbit: Creature = {
  id: "field-rabbit",
  name: "Coelho do Campo",
  image: "/assets/creatures/village-field/field-rabbit.png",
  description: "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
  species: "rabbit",
  level: 1,
  health: 145,
  strength: 9,
  endurance: 19,
  agility: 10,
  experience: 54,
  minBronze: 11,
  maxBronze: 20,
  drops: [
    { itemId: "rabbit-fur", chance: 0.35, minimum: 1, maximum: 2 },
    { itemId: "lucky-foot", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
