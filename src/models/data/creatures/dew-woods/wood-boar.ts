import type { Creature } from "../types";

// Javali da Mata (NV. 131 a 140) da área Mata do Orvalho.
export const woodBoar: Creature = {
  id: "wood-boar",
  name: "Javali da Mata",
  image: "/assets/creatures/dew-woods/wood-boar.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 131,
  health: 980,
  strength: 24,
  endurance: 166,
  agility: 50,
  experience: 964,
  minBronze: 4,
  maxBronze: 8,
  drops: [
    { itemId: "boar-tusk", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "thick-hide", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
