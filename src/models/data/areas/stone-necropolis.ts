import type { Territory } from "./types";

export const stoneNecropolis: Territory = {
  id: "stone-necropolis",
  name: "Stone Necropolis",
  description: "Crypts opened on purpose, their lids leaned with the care of someone planning to return. No turned earth, no missing body, and still the place smells of something recent. Someone left the door like this for you, and has been waiting since long before you were born.",
  species: "vampire",
  minLevel: 601,
  maxLevel: 700,
  danger: "extreme",
  creatures: [
    "skeleton-warrior",
    "crawling-zombie",
    "specter",
    "ghoul",
    "dead-knight",
    "banshee",
    "necromancer",
    "gargoyle",
    "lesser-lich",
    "crypt-guardian",
  ],
};
