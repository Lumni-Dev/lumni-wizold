import type { Creature } from "../types";

// Lobisomem Rival (NV. 851 a 860) da área Castelo Escarlate.
export const rivalWerewolf: Creature = {
  id: "rival-werewolf",
  name: "Lobisomem Rival",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 851,
  health: 24306,
  strength: 4626,
  endurance: 2629,
  agility: 562,
  experience: 6004,
  minBronze: 2187,
  maxBronze: 4061,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
