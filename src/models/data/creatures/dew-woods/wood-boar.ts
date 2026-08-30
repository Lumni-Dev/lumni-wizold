import type { Creature } from "../types";

// Javali da Mata (NV. 131 a 140) da área Mata do Orvalho.
export const woodBoar: Creature = {
  id: "wood-boar",
  name: "Javali da Mata",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 131,
  health: 465,
  strength: 75,
  endurance: 45,
  agility: 50,
  experience: 964,
  minBronze: 52,
  maxBronze: 97,
  drops: [
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
