import type { Creature } from "../types";

// Súcubo (NV. 751 a 760) da área Abismo Uivante.
export const succubus: Creature = {
  id: "succubus",
  name: "Súcubo",
  image: "/assets/creatures/howling-abyss/succubus.png",
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
    { itemId: "succubus-wing", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "shadow-silk", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
