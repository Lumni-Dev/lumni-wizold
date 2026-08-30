import type { Creature } from "../types";

// Ceifador (NV. 771 a 780) da área Abismo Uivante.
export const reaper: Creature = {
  id: "reaper",
  name: "Ceifador",
  image: "",
  description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
  species: "vampire",
  level: 771,
  health: 9209,
  strength: 1862,
  endurance: 1298,
  agility: 510,
  experience: 5444,
  minBronze: 1175,
  maxBronze: 2182,
  drops: [
    { itemId: "empty-fang", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "black-blood", chance: 0.083, minimum: 1, maximum: 2 },
  ],
};
