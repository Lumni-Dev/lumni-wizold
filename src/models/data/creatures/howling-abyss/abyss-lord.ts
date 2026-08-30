import type { Creature } from "../types";

// Senhor do Abismo (NV. 781 a 790) da área Abismo Uivante.
export const abyssLord: Creature = {
  id: "abyss-lord",
  name: "Senhor do Abismo",
  image: "/assets/creatures/howling-abyss/abyss-lord.png",
  description: "Nada aqui é gentil. O chifre atravessa antes de você ouvir o galope.",
  species: "unicorn",
  level: 781,
  health: 8694,
  strength: 1614,
  endurance: 1289,
  agility: 437,
  experience: 5514,
  minBronze: 1178,
  maxBronze: 2188,
  drops: [
    { itemId: "abyss-crown", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "demon-horn", chance: 0.07, minimum: 1, maximum: 1 },
  ],
};
