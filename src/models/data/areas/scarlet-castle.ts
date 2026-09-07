import type { Territory } from "./types";

export const scarletCastle: Territory = {
  id: "scarlet-castle",
  name: "Scarlet Castle",
  description: "Gates open wide, candles lit in a corridor no one has swept for a century. The table is set, the wine is too red, and the master comes down the stairs unhurried, because the night is his and you arrived early. Here the beast is the guest, not the host.",
  species: "vampire",
  minLevel: 801,
  maxLevel: 900,
  danger: "extreme",
  creatures: [
    "vampire-servant",
    "giant-bat",
    "night-noble",
    "scarlet-knight",
    "blood-sorceress",
    "rival-werewolf",
    "elder-vampire",
    "bloody-bride",
    "scarlet-count",
    "night-queen",
  ],
};
