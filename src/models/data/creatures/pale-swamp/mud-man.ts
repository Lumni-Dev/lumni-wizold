import type { Creature } from "../types";

// Homem-Lodo (NV. 361 a 370) da área Pântano Pálido.
export const mudMan: Creature = {
  id: "mud-man",
  name: "Homem-Lodo",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 361,
  health: 2469,
  strength: 375,
  endurance: 247,
  agility: 131,
  experience: 2574,
  minBronze: 253,
  maxBronze: 469,
  drops: [
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
