import type { Creature } from "../types";

export const reaper: Creature = {
  id: "reaper",
  name: "Reaper",
  description: "They do not breathe, do not tire, and already know the taste of your blood.",
  species: "vampire",
  level: 771,
  health: 96613,
  strength: 233,
  endurance: 11793,
  agility: 510,
  experience: 5444,
  minBronze: 13,
  maxBronze: 25,
  drops: [
    { itemId: "reaper-scythe", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "soul-shard", chance: 0.07, minimum: 1, maximum: 1 },
  ],
};
