import type { Creature } from "../types";

// Nobre da Noite (NV. 821 a 830) da área Castelo Escarlate.
export const nightNoble: Creature = {
  id: "night-noble",
  name: "Nobre da Noite",
  image: "/assets/creatures/scarlet-castle/night-noble.png",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 821,
  health: 18379,
  strength: 3647,
  endurance: 2592,
  agility: 542,
  experience: 5794,
  minBronze: 2176,
  maxBronze: 4041,
  drops: [
    { itemId: "noble-signet", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "empty-fang", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
