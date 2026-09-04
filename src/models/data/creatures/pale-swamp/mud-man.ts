import type { Creature } from "../types";

export const mudMan: Creature = {
  id: "mud-man",
  name: "Homem-Lodo",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 361,
  health: 4138,
  strength: 49,
  endurance: 701,
  agility: 131,
  experience: 2574,
  minBronze: 7,
  maxBronze: 13,
  drops: [
    { itemId: "swamp-mud", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "thick-hide", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
