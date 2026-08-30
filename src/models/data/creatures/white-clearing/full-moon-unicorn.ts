import type { Creature } from "../types";

export const fullMoonUnicorn: Creature = {
  id: "full-moon-unicorn",
  name: "Unicórnio da Lua Cheia",
  image: "/assets/creatures/white-clearing/full-moon-unicorn.png",
  description: "Nada aqui é gentil. O chifre atravessa antes de você ouvir o galope.",
  species: "unicorn",
  level: 981,
  health: 500545,
  strength: 516,
  endurance: 65737,
  agility: 547,
  experience: 6914,
  minBronze: 559,
  maxBronze: 1039,
  drops: [
    { itemId: "moon-mane", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "horn-dust", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
