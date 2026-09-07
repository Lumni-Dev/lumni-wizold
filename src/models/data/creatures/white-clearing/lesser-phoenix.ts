import type { Creature } from "../types";

export const lesserPhoenix: Creature = {
  id: "lesser-phoenix",
  name: "Lesser Phoenix",
  description: "They do not breathe, do not tire, and already know the taste of your blood.",
  species: "vampire",
  level: 921,
  health: 373356,
  strength: 460,
  endurance: 45572,
  agility: 607,
  experience: 6494,
  minBronze: 15,
  maxBronze: 29,
  drops: [
    { itemId: "phoenix-ash", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "phoenix-feather", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
