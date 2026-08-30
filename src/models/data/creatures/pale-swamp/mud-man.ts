import type { Creature } from "../types";

// Homem-Lodo (NV. 361 a 370) da área Pântano Pálido.
export const mudMan: Creature = {
  id: "mud-man",
  name: "Homem-Lodo",
  image: "/assets/creatures/pale-swamp/mud-man.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 361,
  health: 4138,
  strength: 49,
  endurance: 701,
  agility: 131,
  experience: 2574,
  minBronze: 205,
  maxBronze: 381,
  drops: [
    { itemId: "swamp-mud", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "thick-hide", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
