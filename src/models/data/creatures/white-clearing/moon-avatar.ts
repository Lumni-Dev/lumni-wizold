import type { Creature } from "../types";

export const moonAvatar: Creature = {
  id: "moon-avatar",
  name: "Avatar da Lua",
  description: "Nada aqui é gentil. O chifre atravessa antes de você ouvir o galope.",
  species: "unicorn",
  level: 991,
  health: 520225,
  strength: 526,
  endurance: 68322,
  agility: 552,
  experience: 6984,
  minBronze: 16,
  maxBronze: 30,
  drops: [
    { itemId: "moon-essence", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "silver-mane", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
