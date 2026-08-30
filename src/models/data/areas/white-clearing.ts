import type { Territory } from "./types";

export const whiteClearing: Territory = {
  id: "white-clearing",
  name: "Clareira Branca",
  description: "Grama alta e clara, sem uma única marca de pata, nem a sua depois que você passa. A luz é sempre a mesma, com lua ou sem lua, e nenhum bicho canta. Nada vive neste lugar por acaso, e o que vive aqui não precisa correr de você.",
  species: "unicorn",
  minLevel: 901,
  maxLevel: 1000,
  danger: "extreme",
  creatures: [
    "wild-unicorn",
    "spectral-stag",
    "lesser-phoenix",
    "chimera",
    "pegasus",
    "sphinx",
    "elder-dragon",
    "fallen-seraph",
    "full-moon-unicorn",
    "moon-avatar",
  ],
};
