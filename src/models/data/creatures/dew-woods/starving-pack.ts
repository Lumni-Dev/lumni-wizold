import type { Creature } from "../types";

export const starvingPack: Creature = {
  id: "starving-pack",
  name: "Starving Pack",
  description: "Hunters, mercenaries and fanatics. They come with silver, fire and method.",
  species: "human",
  level: 191,
  health: 1087,
  strength: 28,
  endurance: 217,
  agility: 102,
  experience: 1384,
  minBronze: 5,
  maxBronze: 9,
  drops: [
    { itemId: "wolf-pelt", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "wolf-fang", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
