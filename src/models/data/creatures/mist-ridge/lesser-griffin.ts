import type { Creature } from "../types";

// Grifo Menor (NV. 291 a 300) da área Serra das Brumas.
export const lesserGriffin: Creature = {
  id: "lesser-griffin",
  name: "Grifo Menor",
  description: "Nada aqui é gentil. O chifre atravessa antes de você ouvir o galope.",
  species: "unicorn",
  level: 291,
  health: 2939,
  strength: 44,
  endurance: 514,
  agility: 167,
  experience: 2084,
  minBronze: 6,
  maxBronze: 12,
  drops: [
    { itemId: "griffin-feather", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "eagle-talon", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
