import type { Territory } from "./types";

export const mistRidge: Territory = {
  id: "mist-ridge",
  name: "Mist Ridge",
  description: "Wet stone, moss and a haze that does not lift even at noon. The roar arrives first, hits the slope and returns from the other side, and you never know which of the two is the beast. Shepherds used to climb here after lost sheep; now they lock the gate and let the sheep go.",
  species: "bear",
  minLevel: 201,
  maxLevel: 300,
  danger: "high",
  creatures: [
    "mountain-goat",
    "royal-eagle",
    "mist-bear",
    "ridge-puma",
    "wild-ram",
    "peregrine-falcon",
    "young-yeti",
    "snow-wolf",
    "slope-ogre",
    "lesser-griffin",
  ],
};
