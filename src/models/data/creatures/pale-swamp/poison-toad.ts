import type { Creature } from "../types";

export const poisonToad: Creature = {
  id: "poison-toad",
  name: "Poison Toad",
  description: "Small, fast and more numerous than they look. The first blood of any werewolf.",
  species: "rabbit",
  level: 301,
  health: 2331,
  strength: 37,
  endurance: 295,
  agility: 220,
  experience: 2154,
  minBronze: 6,
  maxBronze: 12,
  drops: [
    { itemId: "toad-skin", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "venom-gland", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
