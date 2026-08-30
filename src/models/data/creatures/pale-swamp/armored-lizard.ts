import type { Creature } from "../types";

// Lagarto Blindado (NV. 341 a 350) da área Pântano Pálido.
export const armoredLizard: Creature = {
  id: "armored-lizard",
  name: "Lagarto Blindado",
  image: "",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 341,
  health: 1798,
  strength: 284,
  endurance: 235,
  agility: 124,
  experience: 2434,
  minBronze: 246,
  maxBronze: 456,
  drops: [
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
