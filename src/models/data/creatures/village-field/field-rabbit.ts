import type { Creature } from "../types";

export const fieldRabbit: Creature = {
  id: "field-rabbit",
  name: "Field Rabbit",
  description: "Small, fast and more numerous than they look. The first blood of any werewolf.",
  species: "rabbit",
  level: 1,
  health: 145,
  strength: 9,
  endurance: 19,
  agility: 10,
  experience: 54,
  minBronze: 2,
  maxBronze: 4,
  drops: [
    { itemId: "rabbit-fur", chance: 0.35, minimum: 1, maximum: 2 },
    { itemId: "lucky-foot", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
