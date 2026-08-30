import type { Creature } from "../types";

// Quimera (NV. 931 a 940) da área Clareira Branca.
export const chimera: Creature = {
  id: "chimera",
  name: "Quimera",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 931,
  health: 27213,
  strength: 3865,
  endurance: 2739,
  agility: 330,
  experience: 6564,
  minBronze: 2214,
  maxBronze: 4113,
  drops: [
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
