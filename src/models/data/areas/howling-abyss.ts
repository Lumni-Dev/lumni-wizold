import type { Territory } from "./types";

export const howlingAbyss: Territory = {
  id: "howling-abyss",
  name: "Abismo Uivante",
  description: "A pedra desce mais do que a tocha alcança, e o uivo sobe de um lugar que não tem fundo. O ar queima e o chão pulsa, quente como bicho adormecido. Ninguém desce por engano, e quase ninguém sobe de novo.",
  species: "vampire",
  minLevel: 701,
  maxLevel: 800,
  danger: "extreme",
  creatures: [
    "shadow-imp",
    "hellhound",
    "lesser-demon",
    "eye-aberration",
    "lava-golem",
    "succubus",
    "young-behemoth",
    "reaper",
    "abyss-lord",
    "cave-dragon",
  ],
};
