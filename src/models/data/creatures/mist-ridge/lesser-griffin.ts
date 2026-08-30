import type { Creature } from "../types";

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
  minBronze: 173,
  maxBronze: 321,
  drops: [
    { itemId: "griffin-feather", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "eagle-talon", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
