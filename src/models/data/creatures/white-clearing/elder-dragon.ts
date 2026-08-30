import type { Creature } from "../types";

// Dragão Ancião (NV. 961 a 970) da área Clareira Branca.
export const elderDragon: Creature = {
  id: "elder-dragon",
  name: "Dragão Ancião",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 961,
  health: 27316,
  strength: 3883,
  endurance: 2750,
  agility: 341,
  experience: 6774,
  minBronze: 2225,
  maxBronze: 4131,
  drops: [
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
