import type { Creature } from "../types";

// Pégaso (NV. 941 a 950) da área Clareira Branca.
export const pegasus: Creature = {
  id: "pegasus",
  name: "Pégaso",
  image: "/assets/creatures/white-clearing/pegasus.png",
  description: "Nada aqui é gentil. O chifre atravessa antes de você ouvir o galope.",
  species: "unicorn",
  level: 941,
  health: 421444,
  strength: 473,
  endurance: 55349,
  agility: 525,
  experience: 6634,
  minBronze: 15,
  maxBronze: 29,
  drops: [
    { itemId: "pegasus-feather", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "silver-mane", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
