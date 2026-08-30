import type { Creature } from "../types";

// Avatar da Lua (NV. 991 a 1000) da área Clareira Branca.
export const moonAvatar: Creature = {
  id: "moon-avatar",
  name: "Avatar da Lua",
  description: "Nada aqui é gentil. O chifre atravessa antes de você ouvir o galope.",
  species: "unicorn",
  level: 991,
  health: 26452,
  strength: 4640,
  endurance: 3010,
  agility: 552,
  experience: 6984,
  minBronze: 2235,
  maxBronze: 4151,
  drops: [
    { itemId: "silver-mane", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "horn-dust", chance: 0.075, minimum: 1, maximum: 2 },
  ],
};
