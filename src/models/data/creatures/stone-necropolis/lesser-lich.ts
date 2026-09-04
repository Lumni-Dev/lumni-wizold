import type { Creature } from "../types";

export const lesserLich: Creature = {
  id: "lesser-lich",
  name: "Lich Menor",
  description: "Nada aqui é gentil. O chifre atravessa antes de você ouvir o galope.",
  species: "unicorn",
  level: 681,
  health: 62860,
  strength: 182,
  endurance: 8256,
  agility: 382,
  experience: 4814,
  minBronze: 12,
  maxBronze: 22,
  drops: [
    { itemId: "lich-phylactery", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "necro-tome", chance: 0.07, minimum: 1, maximum: 1 },
  ],
};
