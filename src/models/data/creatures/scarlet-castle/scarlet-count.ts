import type { Creature } from "../types";

// Conde Escarlate (NV. 881 a 890) da área Castelo Escarlate.
export const scarletCount: Creature = {
  id: "scarlet-count",
  name: "Conde Escarlate",
  image: "",
  description: "Nada aqui é gentil. O chifre atravessa antes de você ouvir o galope.",
  species: "unicorn",
  level: 881,
  health: 17525,
  strength: 3199,
  endurance: 2601,
  agility: 492,
  experience: 6214,
  minBronze: 2197,
  maxBronze: 4080,
  drops: [
    { itemId: "silver-mane", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "horn-dust", chance: 0.075, minimum: 1, maximum: 2 },
  ],
};
