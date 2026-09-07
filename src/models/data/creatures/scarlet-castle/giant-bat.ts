import type { Creature } from "../types";

export const giantBat: Creature = {
  id: "giant-bat",
  name: "Giant Bat",
  description: "Small, fast and more numerous than they look. The first blood of any werewolf.",
  species: "rabbit",
  level: 811,
  health: 123757,
  strength: 241,
  endurance: 11754,
  agility: 577,
  experience: 5724,
  minBronze: 13,
  maxBronze: 25,
  drops: [
    { itemId: "bat-wing", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "bat-fang", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
