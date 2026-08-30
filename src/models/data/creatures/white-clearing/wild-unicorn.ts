import type { Creature } from "../types";

// Unicórnio Selvagem (NV. 901 a 910) da área Clareira Branca.
export const wildUnicorn: Creature = {
  id: "wild-unicorn",
  name: "Unicórnio Selvagem",
  description: "Nada aqui é gentil. O chifre atravessa antes de você ouvir o galope.",
  species: "unicorn",
  level: 901,
  health: 23505,
  strength: 4113,
  endurance: 2675,
  agility: 503,
  experience: 6354,
  minBronze: 2204,
  maxBronze: 4093,
  drops: [
    { itemId: "silver-mane", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "horn-dust", chance: 0.075, minimum: 1, maximum: 2 },
  ],
};
