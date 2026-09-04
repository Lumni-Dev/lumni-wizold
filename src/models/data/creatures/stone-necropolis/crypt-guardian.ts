import type { Creature } from "../types";

export const cryptGuardian: Creature = {
  id: "crypt-guardian",
  name: "Guardião da Cripta",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 691,
  health: 68985,
  strength: 180,
  endurance: 8778,
  agility: 246,
  experience: 4884,
  minBronze: 12,
  maxBronze: 22,
  drops: [
    { itemId: "guardian-relic", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "bone-shard", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
