import type { Creature } from "../types";

// Aranha Gigante (NV. 181 a 190) da área Mata do Orvalho.
export const giantSpider: Creature = {
  id: "giant-spider",
  name: "Aranha Gigante",
  image: "/assets/creatures/dew-woods/giant-spider.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 181,
  health: 420,
  strength: 96,
  endurance: 58,
  agility: 126,
  experience: 1314,
  minBronze: 69,
  maxBronze: 129,
  drops: [
    { itemId: "spider-silk", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "venom-gland", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
