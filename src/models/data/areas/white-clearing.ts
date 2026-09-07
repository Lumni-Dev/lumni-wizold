import type { Territory } from "./types";

export const whiteClearing: Territory = {
  id: "white-clearing",
  name: "White Clearing",
  description: "Tall pale grass without a single paw print, not even yours after you pass. The light is always the same, moon or no moon, and no creature sings. Nothing lives in this place by chance, and what lives here does not need to run from you.",
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
