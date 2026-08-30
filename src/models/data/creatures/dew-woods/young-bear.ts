import type { Creature } from "../types";

// Urso Pardo Jovem (NV. 151 a 160) da área Mata do Orvalho.
export const youngBear: Creature = {
  id: "young-bear",
  name: "Urso Pardo Jovem",
  image: "/assets/creatures/dew-woods/young-bear.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 151,
  health: 1102,
  strength: 25,
  endurance: 186,
  agility: 57,
  experience: 1104,
  minBronze: 95,
  maxBronze: 176,
  drops: [
    { itemId: "bear-pelt", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "bear-claw", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
