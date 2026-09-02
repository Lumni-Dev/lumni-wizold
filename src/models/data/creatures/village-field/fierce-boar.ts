import type { Creature } from "../types";

// Javali Bravo (NV. 61 a 70) da área Campo do Vilarejo.
export const fierceBoar: Creature = {
  id: "fierce-boar",
  name: "Javali Bravo",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 61,
  health: 556,
  strength: 18,
  endurance: 94,
  agility: 26,
  experience: 474,
  minBronze: 3,
  maxBronze: 5,
  drops: [
    { itemId: "boar-tusk", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "thick-hide", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
