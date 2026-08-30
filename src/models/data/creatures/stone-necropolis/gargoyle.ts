import type { Creature } from "../types";

// Gárgula (NV. 671 a 680) da área Necrópole de Pedra.
export const gargoyle: Creature = {
  id: "gargoyle",
  name: "Gárgula",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 671,
  health: 13864,
  strength: 1990,
  endurance: 1395,
  agility: 239,
  experience: 4744,
  minBronze: 1140,
  maxBronze: 2118,
  drops: [
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
