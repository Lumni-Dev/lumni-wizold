import type { Creature } from "../types";

export const necromancer: Creature = {
  id: "necromancer",
  name: "Necromancer",
  description: "Hunters, mercenaries and fanatics. They come with silver, fire and method.",
  species: "human",
  level: 661,
  health: 45943,
  strength: 167,
  endurance: 6884,
  agility: 337,
  experience: 4674,
  minBronze: 11,
  maxBronze: 21,
  drops: [
    { itemId: "necro-tome", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "cursed-charm", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
