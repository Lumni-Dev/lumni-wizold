import type { Creature } from "../types";

export const swampWitch: Creature = {
  id: "swamp-witch",
  name: "Swamp Witch",
  description: "Hunters, mercenaries and fanatics. They come with silver, fire and method.",
  species: "human",
  level: 391,
  health: 3743,
  strength: 53,
  endurance: 746,
  agility: 202,
  experience: 2784,
  minBronze: 8,
  maxBronze: 14,
  drops: [
    { itemId: "witch-hair", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "cursed-charm", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
