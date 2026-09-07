import type { Creature } from "../types";

export const mercenary: Creature = {
  id: "mercenary",
  name: "Mercenary",
  description: "Hunters, mercenaries and fanatics. They come with silver, fire and method.",
  species: "human",
  level: 421,
  health: 7674,
  strength: 67,
  endurance: 1150,
  agility: 217,
  experience: 2994,
  minBronze: 8,
  maxBronze: 16,
  drops: [
    { itemId: "steel-scrap", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "silver-charm", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
