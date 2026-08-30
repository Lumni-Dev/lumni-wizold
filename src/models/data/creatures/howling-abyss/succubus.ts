import type { Creature } from "../types";

// Súcubo (NV. 751 a 760) da área Abismo Uivante.
export const succubus: Creature = {
  id: "succubus",
  name: "Súcubo",
  image: "",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 751,
  health: 8952,
  strength: 1808,
  endurance: 1262,
  agility: 497,
  experience: 5304,
  minBronze: 1168,
  maxBronze: 2169,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
