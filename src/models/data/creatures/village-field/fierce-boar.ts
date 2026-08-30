import type { Creature } from "../types";

// Javali Bravo (NV. 61 a 70) da área Campo do Vilarejo.
export const fierceBoar: Creature = {
  id: "fierce-boar",
  name: "Javali Bravo",
  image: "/assets/creatures/village-field/fierce-boar.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 61,
  health: 199,
  strength: 32,
  endurance: 24,
  agility: 26,
  experience: 474,
  minBronze: 28,
  maxBronze: 51,
  drops: [
    { itemId: "boar-tusk", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "thick-hide", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
