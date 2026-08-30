import type { Creature } from "../types";

// Rainha da Noite (NV. 891 a 900) da área Castelo Escarlate.
export const nightQueen: Creature = {
  id: "night-queen",
  name: "Rainha da Noite",
  image: "/assets/creatures/scarlet-castle/night-queen.png",
  description: "Nada aqui é gentil. O chifre atravessa antes de você ouvir o galope.",
  species: "unicorn",
  level: 891,
  health: 17775,
  strength: 3245,
  endurance: 2638,
  agility: 497,
  experience: 6284,
  minBronze: 2201,
  maxBronze: 4087,
  drops: [
    { itemId: "queen-tiara", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "black-blood", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
