import type { Creature } from "../types";

export const mosquitoSwarm: Creature = {
  id: "mosquito-swarm",
  name: "Mosquito Swarm",
  description: "Small, fast and more numerous than they look. The first blood of any werewolf.",
  species: "rabbit",
  level: 351,
  health: 2912,
  strength: 41,
  endurance: 368,
  agility: 255,
  experience: 2504,
  minBronze: 7,
  maxBronze: 13,
  drops: [
    { itemId: "mosquito-wing", chance: 0.35, minimum: 1, maximum: 2 },
    { itemId: "venom-gland", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
