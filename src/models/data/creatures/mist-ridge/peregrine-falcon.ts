import type { Creature } from "../types";

export const peregrineFalcon: Creature = {
  id: "peregrine-falcon",
  name: "Peregrine Falcon",
  description: "Small, fast and more numerous than they look. The first blood of any werewolf.",
  species: "rabbit",
  level: 251,
  health: 1754,
  strength: 32,
  endurance: 222,
  agility: 185,
  experience: 1804,
  minBronze: 6,
  maxBronze: 10,
  drops: [
    { itemId: "falcon-feather", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "talon", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
