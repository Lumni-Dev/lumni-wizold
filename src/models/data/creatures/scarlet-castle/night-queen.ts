import type { Creature } from "../types";

// Rainha da Noite (NV. 891 a 900) da área Castelo Escarlate.
export const nightQueen: Creature = {
  id: "night-queen",
  name: "Rainha da Noite",
  description: "Nada aqui é gentil. O chifre atravessa antes de você ouvir o galope.",
  species: "unicorn",
  level: 891,
  health: 23184,
  strength: 4056,
  endurance: 2638,
  agility: 497,
  experience: 6284,
  minBronze: 2201,
  maxBronze: 4087,
  drops: [
    { itemId: "silver-mane", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "horn-dust", chance: 0.075, minimum: 1, maximum: 2 },
  ],
};
