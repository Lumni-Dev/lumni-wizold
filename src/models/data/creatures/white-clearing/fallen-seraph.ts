import type { Creature } from "../types";

// Serafim Caído (NV. 971 a 980) da área Clareira Branca.
export const fallenSeraph: Creature = {
  id: "fallen-seraph",
  name: "Serafim Caído",
  description: "Nada aqui é gentil. O chifre atravessa antes de você ouvir o galope.",
  species: "unicorn",
  level: 971,
  health: 480479,
  strength: 506,
  endurance: 63102,
  agility: 541,
  experience: 6844,
  minBronze: 16,
  maxBronze: 30,
  drops: [
    { itemId: "seraph-feather", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "halo-shard", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
