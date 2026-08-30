import type { Creature } from "../types";

// Nobre da Noite (NV. 821 a 830) da área Castelo Escarlate.
export const nightNoble: Creature = {
  id: "night-noble",
  name: "Nobre da Noite",
  image: "",
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
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
