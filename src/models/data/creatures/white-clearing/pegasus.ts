import type { Creature } from "../types";

// Pégaso (NV. 941 a 950) da área Clareira Branca.
export const pegasus: Creature = {
  id: "pegasus",
  name: "Pégaso",
  description: "Nada aqui é gentil. O chifre atravessa antes de você ouvir o galope.",
  species: "unicorn",
  level: 941,
  health: 24806,
  strength: 4346,
  endurance: 2823,
  agility: 525,
  experience: 6634,
  minBronze: 2218,
  maxBronze: 4118,
  drops: [
    { itemId: "silver-mane", chance: 0.165, minimum: 1, maximum: 2 },
    { itemId: "horn-dust", chance: 0.075, minimum: 1, maximum: 2 },
  ],
};
