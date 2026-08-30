import type { Creature } from "../types";

// Unicórnio da Lua Cheia (NV. 981 a 990) da área Clareira Branca.
export const fullMoonUnicorn: Creature = {
  id: "full-moon-unicorn",
  name: "Unicórnio da Lua Cheia",
  description: "Nada aqui é gentil. O chifre atravessa antes de você ouvir o galope.",
  species: "unicorn",
  level: 981,
  health: 26119,
  strength: 4581,
  endurance: 2972,
  agility: 547,
  experience: 6914,
  minBronze: 2231,
  maxBronze: 4144,
  drops: [
    { itemId: "silver-mane", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "horn-dust", chance: 0.075, minimum: 1, maximum: 2 },
  ],
};
