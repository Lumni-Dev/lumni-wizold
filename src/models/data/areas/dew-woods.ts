import type { Territory } from "./types";

export const dewWoods: Territory = {
  id: "dew-woods",
  name: "Dew Woods",
  description: "Low trees and ground that never dries, keeping every footprint like evidence. The thin mist fools the eye but not the nose, and the deer knows it: it stops, listens and vanishes before you lift your head. Whoever comes back empty-handed from here tends to repeat the same mistake the following week.",
  species: "deer",
  minLevel: 101,
  maxLevel: 200,
  danger: "moderate",
  creatures: [
    "young-deer",
    "brown-owl",
    "grey-wolf",
    "wood-boar",
    "green-serpent",
    "young-bear",
    "wildcat",
    "twisted-antler-stag",
    "giant-spider",
    "starving-pack",
  ],
};
