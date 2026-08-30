import type { Creature } from "../types";

// Cavaleiro Morto (NV. 641 a 650) da área Necrópole de Pedra.
export const deadKnight: Creature = {
  id: "dead-knight",
  name: "Cavaleiro Morto",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 641,
  health: 13755,
  strength: 1972,
  endurance: 1384,
  agility: 229,
  experience: 4534,
  minBronze: 1130,
  maxBronze: 2098,
  drops: [
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
