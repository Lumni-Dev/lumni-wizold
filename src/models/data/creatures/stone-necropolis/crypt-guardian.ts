import type { Creature } from "../types";

// Guardião da Cripta (NV. 691 a 700) da área Necrópole de Pedra.
export const cryptGuardian: Creature = {
  id: "crypt-guardian",
  name: "Guardião da Cripta",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 691,
  health: 13934,
  strength: 2002,
  endurance: 1402,
  agility: 246,
  experience: 4884,
  minBronze: 1147,
  maxBronze: 2131,
  drops: [
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
