import type { Creature } from "../types";

// Avatar da Lua (NV. 991 a 1000) da área Clareira Branca.
export const moonAvatar: Creature = {
  id: "moon-avatar",
  name: "Avatar da Lua",
  image: "/assets/creatures/white-clearing/moon-avatar.png",
  description: "Nada aqui é gentil. O chifre atravessa antes de você ouvir o galope.",
  species: "unicorn",
  level: 991,
  health: 20280,
  strength: 3712,
  endurance: 3010,
  agility: 552,
  experience: 6984,
  minBronze: 2235,
  maxBronze: 4151,
  drops: [
    { itemId: "moon-essence", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "silver-mane", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
