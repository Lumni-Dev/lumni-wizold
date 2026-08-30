import type { Creature } from "../types";

// Verme das Areias (NV. 541 a 550) da área Ermo Cinza.
export const sandWorm: Creature = {
  id: "sand-worm",
  name: "Verme das Areias",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 541,
  health: 9420,
  strength: 1361,
  endurance: 947,
  agility: 194,
  experience: 3834,
  minBronze: 780,
  maxBronze: 1448,
  drops: [
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
