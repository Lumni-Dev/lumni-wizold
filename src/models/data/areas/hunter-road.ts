import type { Territory } from "./types";

export const hunterRoad: Territory = {
  id: "hunter-road",
  name: "Hunters' Road",
  description: "Torches in a line as far as the eye can see and silver chains hung from the branches, chiming with the wind to warn whoever passes. It is not a trap for beasts, it is a message. They come in groups, sleep in shifts, and know exactly what they are hunting.",
  species: "human",
  minLevel: 401,
  maxLevel: 500,
  danger: "high",
  creatures: [
    "novice-hunter",
    "road-scout",
    "mercenary",
    "silver-archer",
    "hunting-hound",
    "masked-bandit",
    "wandering-knight",
    "inquisitor",
    "order-captain",
    "master-hunter",
  ],
};
