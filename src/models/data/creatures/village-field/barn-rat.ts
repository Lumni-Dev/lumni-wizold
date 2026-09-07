import type { Creature } from "../types";

export const barnRat: Creature = {
  id: "barn-rat",
  name: "Barn Rat",
  description: "Small, fast and more numerous than they look. The first blood of any werewolf.",
  species: "rabbit",
  level: 11,
  health: 188,
  strength: 11,
  endurance: 24,
  agility: 17,
  experience: 124,
  minBronze: 2,
  maxBronze: 4,
  drops: [
    { itemId: "rat-tail", chance: 0.35, minimum: 1, maximum: 2 },
    { itemId: "gnawed-bone", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
