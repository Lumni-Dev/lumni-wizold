import type { Creature } from "../types";

export const wildHen: Creature = {
  id: "wild-hen",
  name: "Wild Hen",
  description: "Small, fast and more numerous than they look. The first blood of any werewolf.",
  species: "rabbit",
  level: 21,
  health: 230,
  strength: 12,
  endurance: 29,
  agility: 24,
  experience: 194,
  minBronze: 3,
  maxBronze: 5,
  drops: [
    { itemId: "feather", chance: 0.35, minimum: 1, maximum: 2 },
    { itemId: "poultry-meat", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
