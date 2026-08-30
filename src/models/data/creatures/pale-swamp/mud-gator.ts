import type { Creature } from "../types";

// Jacaré do Lodo (NV. 311 a 320) da área Pântano Pálido.
export const mudGator: Creature = {
  id: "mud-gator",
  name: "Jacaré do Lodo",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 311,
  health: 2242,
  strength: 338,
  endurance: 224,
  agility: 113,
  experience: 2224,
  minBronze: 236,
  maxBronze: 438,
  drops: [
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
