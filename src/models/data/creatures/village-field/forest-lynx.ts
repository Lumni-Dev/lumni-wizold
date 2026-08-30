import type { Creature } from "../types";

// Lince do Mato (NV. 91 a 100) da área Campo do Vilarejo.
export const forestLynx: Creature = {
  id: "forest-lynx",
  name: "Lince do Mato",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 91,
  health: 315,
  strength: 67,
  endurance: 32,
  agility: 68,
  experience: 684,
  minBronze: 38,
  maxBronze: 71,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
