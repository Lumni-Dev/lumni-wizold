import type { Creature } from "../types";

// Escorpião Gigante (NV. 521 a 530) da área Ermo Cinza.
export const giantScorpion: Creature = {
  id: "giant-scorpion",
  name: "Escorpião Gigante",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 521,
  health: 6932,
  strength: 1343,
  endurance: 749,
  agility: 347,
  experience: 3694,
  minBronze: 773,
  maxBronze: 1436,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
