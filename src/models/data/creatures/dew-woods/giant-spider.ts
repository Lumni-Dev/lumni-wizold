import type { Creature } from "../types";

export const giantSpider: Creature = {
  id: "giant-spider",
  name: "Aranha Gigante",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 181,
  health: 1211,
  strength: 29,
  endurance: 197,
  agility: 126,
  experience: 1314,
  minBronze: 5,
  maxBronze: 9,
  drops: [
    { itemId: "spider-silk", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "venom-gland", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
