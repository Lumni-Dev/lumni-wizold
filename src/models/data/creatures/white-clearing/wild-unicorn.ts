import type { Creature } from "../types";

export const wildUnicorn: Creature = {
  id: "wild-unicorn",
  name: "Unicórnio Selvagem",
  image: "/assets/creatures/white-clearing/wild-unicorn.png",
  description: "Nada aqui é gentil. O chifre atravessa antes de você ouvir o galope.",
  species: "unicorn",
  level: 901,
  health: 342347,
  strength: 427,
  endurance: 44960,
  agility: 503,
  experience: 6354,
  minBronze: 515,
  maxBronze: 956,
  drops: [
    { itemId: "silver-mane", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "horn-dust", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
