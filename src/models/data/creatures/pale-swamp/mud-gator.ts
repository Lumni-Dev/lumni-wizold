import type { Creature } from "../types";

// Jacaré do Lodo (NV. 311 a 320) da área Pântano Pálido.
export const mudGator: Creature = {
  id: "mud-gator",
  name: "Jacaré do Lodo",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 311,
  health: 3353,
  strength: 44,
  endurance: 567,
  agility: 113,
  experience: 2224,
  minBronze: 6,
  maxBronze: 12,
  drops: [
    { itemId: "gator-scale", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "gator-tooth", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
