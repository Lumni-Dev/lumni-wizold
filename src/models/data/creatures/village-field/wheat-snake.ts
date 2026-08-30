import type { Creature } from "../types";

// Cobra do Trigo (NV. 71 a 80) da área Campo do Vilarejo.
export const wheatSnake: Creature = {
  id: "wheat-snake",
  name: "Cobra do Trigo",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 71,
  health: 263,
  strength: 55,
  endurance: 27,
  agility: 55,
  experience: 544,
  minBronze: 31,
  maxBronze: 59,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
