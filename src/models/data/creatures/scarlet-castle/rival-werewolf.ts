import type { Creature } from "../types";

// Lobisomem Rival (NV. 851 a 860) da área Castelo Escarlate.
export const rivalWerewolf: Creature = {
  id: "rival-werewolf",
  name: "Lobisomem Rival",
  image: "/assets/creatures/scarlet-castle/rival-werewolf.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 851,
  health: 237864,
  strength: 367,
  endurance: 29034,
  agility: 562,
  experience: 6004,
  minBronze: 14,
  maxBronze: 26,
  drops: [
    { itemId: "rival-pelt", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "wolf-fang", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
