import type { Creature } from "../types";

// Escorpião Gigante (NV. 521 a 530) da área Ermo Cinza.
export const giantScorpion: Creature = {
  id: "giant-scorpion",
  name: "Escorpião Gigante",
  image: "/assets/creatures/grey-wastes/giant-scorpion.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 521,
  health: 17133,
  strength: 97,
  endurance: 2092,
  agility: 347,
  experience: 3694,
  minBronze: 576,
  maxBronze: 1070,
  drops: [
    { itemId: "scorpion-stinger", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "chitin-plate", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
