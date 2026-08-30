import type { Creature } from "../types";

// Javali Bravo (NV. 61 a 70) da área Campo do Vilarejo.
export const fierceBoar: Creature = {
  id: "fierce-boar",
  name: "Javali Bravo",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 61,
  health: 259,
  strength: 40,
  endurance: 24,
  agility: 26,
  experience: 474,
  minBronze: 28,
  maxBronze: 51,
  drops: [
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
