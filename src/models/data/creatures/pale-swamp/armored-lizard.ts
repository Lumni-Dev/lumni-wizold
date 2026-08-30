import type { Creature } from "../types";

export const armoredLizard: Creature = {
  id: "armored-lizard",
  name: "Lagarto Blindado",
  image: "/assets/creatures/pale-swamp/armored-lizard.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 341,
  health: 3825,
  strength: 48,
  endurance: 647,
  agility: 124,
  experience: 2434,
  minBronze: 201,
  maxBronze: 373,
  drops: [
    { itemId: "lizard-scale", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "thick-hide", chance: 0.35, minimum: 1, maximum: 2 },
  ],
};
