import type { Creature } from "../types";

// Guardião da Cripta (NV. 691 a 700) da área Necrópole de Pedra.
export const cryptGuardian: Creature = {
  id: "crypt-guardian",
  name: "Guardião da Cripta",
  image: "/assets/creatures/stone-necropolis/crypt-guardian.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 691,
  health: 68985,
  strength: 180,
  endurance: 8778,
  agility: 246,
  experience: 4884,
  minBronze: 397,
  maxBronze: 737,
  drops: [
    { itemId: "guardian-relic", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "bone-shard", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
