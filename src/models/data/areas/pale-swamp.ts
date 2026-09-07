import type { Territory } from "./types";

export const paleSwamp: Territory = {
  id: "pale-swamp",
  name: "Pale Swamp",
  description: "Still water the color of lead and a sweet smell of drowned things. The ground swallows the boot and gives back bubbles, and what lives here learned to wait under the mud until the prey walks by. Every step is a bet, and the way out is never where you left it.",
  species: "bear",
  minLevel: 301,
  maxLevel: 400,
  danger: "high",
  creatures: [
    "poison-toad",
    "mud-gator",
    "giant-leech",
    "swamp-serpent",
    "armored-lizard",
    "mosquito-swarm",
    "mud-man",
    "marsh-naga",
    "young-hydra",
    "swamp-witch",
  ],
};
