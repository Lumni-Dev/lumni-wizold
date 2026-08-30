import type { Creature } from "../types";

export const nightQueen: Creature = {
  id: "night-queen",
  name: "Rainha da Noite",
  image: "/assets/creatures/scarlet-castle/night-queen.png",
  description: "Nada aqui é gentil. O chifre atravessa antes de você ouvir o galope.",
  species: "unicorn",
  level: 891,
  health: 322281,
  strength: 414,
  endurance: 42325,
  agility: 497,
  experience: 6284,
  minBronze: 509,
  maxBronze: 945,
  drops: [
    { itemId: "queen-tiara", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "black-blood", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
