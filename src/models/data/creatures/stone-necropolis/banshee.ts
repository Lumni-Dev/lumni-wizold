import type { Creature } from "../types";

// Banshee (NV. 651 a 660) da área Necrópole de Pedra.
export const banshee: Creature = {
  id: "banshee",
  name: "Banshee",
  image: "/assets/creatures/stone-necropolis/banshee.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 651,
  health: 49757,
  strength: 167,
  endurance: 6074,
  agility: 432,
  experience: 4604,
  minBronze: 703,
  maxBronze: 1305,
  drops: [
    { itemId: "banshee-wail", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "ectoplasm", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
