import type { Creature } from "../types";

// Serafim Caído (NV. 971 a 980) da área Clareira Branca.
export const fallenSeraph: Creature = {
  id: "fallen-seraph",
  name: "Serafim Caído",
  description: "Nada aqui é gentil. O chifre atravessa antes de você ouvir o galope.",
  species: "unicorn",
  level: 971,
  health: 25793,
  strength: 4522,
  endurance: 2935,
  agility: 541,
  experience: 6844,
  minBronze: 2228,
  maxBronze: 4138,
  drops: [
    { itemId: "silver-mane", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "horn-dust", chance: 0.075, minimum: 1, maximum: 2 },
  ],
};
