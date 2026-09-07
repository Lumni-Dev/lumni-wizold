import type { Creature } from "../types";

export const rivalWerewolf: Creature = {
  id: "rival-werewolf",
  name: "Rival Werewolf",
  description: "They do not breathe, do not tire, and already know the taste of your blood.",
  species: "vampire",
  level: 851,
  health: 237864,
  strength: 367,
  endurance: 29034,
  agility: 562,
  experience: 6004,
  minBronze: 14,
  maxBronze: 26,
  drops: [
    { itemId: "rival-pelt", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "wolf-fang", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
