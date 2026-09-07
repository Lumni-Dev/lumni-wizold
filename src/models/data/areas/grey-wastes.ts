import type { Territory } from "./types";

export const greyWastes: Territory = {
  id: "grey-wastes",
  name: "Grey Wastes",
  description: "Cracked earth to the horizon, no shade and no water, only white bone marking those who tried to cross. The wind carries sand and voices, and the voice is not always of the living. Here you hunt what hunts you, because stopping means becoming a roadside marker.",
  species: "human",
  minLevel: 501,
  maxLevel: 600,
  danger: "extreme",
  creatures: [
    "carrion-vulture",
    "wastes-hyena",
    "giant-scorpion",
    "starving-jackal",
    "sand-worm",
    "wild-raider",
    "lesser-gorgon",
    "stone-golem",
    "basilisk",
    "wastes-lord",
  ],
};
