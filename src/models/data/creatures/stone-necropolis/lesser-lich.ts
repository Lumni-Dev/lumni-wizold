import type { Creature } from "../types";

// Lich Menor (NV. 681 a 690) da área Necrópole de Pedra.
export const lesserLich: Creature = {
  id: "lesser-lich",
  name: "Lich Menor",
  description: "Nada aqui é gentil. O chifre atravessa antes de você ouvir o galope.",
  species: "unicorn",
  level: 681,
  health: 11059,
  strength: 1959,
  endurance: 1257,
  agility: 382,
  experience: 4814,
  minBronze: 1143,
  maxBronze: 2124,
  drops: [
    { itemId: "silver-mane", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "horn-dust", chance: 0.075, minimum: 1, maximum: 2 },
  ],
};
