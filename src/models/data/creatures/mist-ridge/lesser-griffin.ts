import type { Creature } from "../types";

// Grifo Menor (NV. 291 a 300) da área Serra das Brumas.
export const lesserGriffin: Creature = {
  id: "lesser-griffin",
  name: "Grifo Menor",
  image: "/assets/creatures/mist-ridge/lesser-griffin.png",
  description: "Nada aqui é gentil. O chifre atravessa antes de você ouvir o galope.",
  species: "unicorn",
  level: 291,
  health: 2939,
  strength: 44,
  endurance: 514,
  agility: 167,
  experience: 2084,
  minBronze: 181,
  maxBronze: 337,
  drops: [
    { itemId: "griffin-feather", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "eagle-talon", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
