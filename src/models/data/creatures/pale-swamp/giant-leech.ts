import type { Creature } from "../types";

// Sanguessuga Gigante (NV. 321 a 330) da área Pântano Pálido.
export const giantLeech: Creature = {
  id: "giant-leech",
  name: "Sanguessuga Gigante",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 321,
  health: 3322,
  strength: 48,
  endurance: 540,
  agility: 217,
  experience: 2294,
  minBronze: 7,
  maxBronze: 13,
  drops: [
    { itemId: "leech-blood", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "venom-gland", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
