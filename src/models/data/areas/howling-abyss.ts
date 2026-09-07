import type { Territory } from "./types";

export const howlingAbyss: Territory = {
  id: "howling-abyss",
  name: "Howling Abyss",
  description: "The stone goes down farther than the torch can reach, and the howl rises from a place with no bottom. The air burns and the ground pulses, warm like a sleeping beast. No one goes down by mistake, and almost no one climbs back up.",
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
