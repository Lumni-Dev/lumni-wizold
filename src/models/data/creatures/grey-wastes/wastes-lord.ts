import type { Creature } from "../types";

export const wastesLord: Creature = {
  id: "wastes-lord",
  name: "Lord of the Wastes",
  description: "Hunters, mercenaries and fanatics. They come with silver, fire and method.",
  species: "human",
  level: 591,
  health: 19553,
  strength: 108,
  endurance: 2930,
  agility: 302,
  experience: 4184,
  minBronze: 11,
  maxBronze: 20,
  drops: [
    { itemId: "wastes-crown", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "coin-purse", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
