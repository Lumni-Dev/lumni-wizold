import type { Creature } from "../types";

export const giantLeech: Creature = {
  id: "giant-leech",
  name: "Sanguessuga Gigante",
  image: "/assets/creatures/pale-swamp/giant-leech.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 321,
  health: 3322,
  strength: 48,
  endurance: 540,
  agility: 217,
  experience: 2294,
  minBronze: 190,
  maxBronze: 352,
  drops: [
    { itemId: "leech-blood", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "venom-gland", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
