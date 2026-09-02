import type { Creature } from "../types";

// Cobra do Trigo (NV. 71 a 80) da área Campo do Vilarejo.
export const wheatSnake: Creature = {
  id: "wheat-snake",
  name: "Cobra do Trigo",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 71,
  health: 588,
  strength: 20,
  endurance: 95,
  agility: 55,
  experience: 544,
  minBronze: 4,
  maxBronze: 7,
  drops: [
    { itemId: "snake-skin", chance: 0.35, minimum: 1, maximum: 2 },
    { itemId: "venom-gland", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
