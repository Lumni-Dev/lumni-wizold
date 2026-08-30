import type { Creature } from "../types";

// Conde Escarlate (NV. 881 a 890) da área Castelo Escarlate.
export const scarletCount: Creature = {
  id: "scarlet-count",
  name: "Conde Escarlate",
  image: "/assets/creatures/scarlet-castle/scarlet-count.png",
  description: "Nada aqui é gentil. O chifre atravessa antes de você ouvir o galope.",
  species: "unicorn",
  level: 881,
  health: 302601,
  strength: 401,
  endurance: 39740,
  agility: 492,
  experience: 6214,
  minBronze: 10151,
  maxBronze: 18851,
  drops: [
    { itemId: "count-crown", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "black-blood", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
