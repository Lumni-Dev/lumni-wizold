import type { Creature } from "../types";

// Cão Selvagem (NV. 51 a 60) da área Campo do Vilarejo.
export const wildDog: Creature = {
  id: "wild-dog",
  name: "Cão Selvagem",
  image: "/assets/creatures/village-field/wild-dog.png",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 51,
  health: 404,
  strength: 16,
  endurance: 69,
  agility: 38,
  experience: 404,
  minBronze: 39,
  maxBronze: 72,
  drops: [
    { itemId: "canine-pelt", chance: 0.35, minimum: 1, maximum: 2 },
    { itemId: "sharp-fang", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
