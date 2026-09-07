import type { Creature } from "../types";

export const shadowImp: Creature = {
  id: "shadow-imp",
  name: "Shadow Imp",
  description: "Small, fast and more numerous than they look. The first blood of any werewolf.",
  species: "rabbit",
  level: 701,
  health: 53464,
  strength: 158,
  endurance: 5078,
  agility: 500,
  experience: 4954,
  minBronze: 12,
  maxBronze: 22,
  drops: [
    { itemId: "imp-horn", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "shadow-essence", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
