import type { Creature } from "../types";

// Quimera (NV. 931 a 940) da área Clareira Branca.
export const chimera: Creature = {
  id: "chimera",
  name: "Quimera",
  image: "/assets/creatures/white-clearing/chimera.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 931,
  health: 414281,
  strength: 442,
  endurance: 52713,
  agility: 330,
  experience: 6564,
  minBronze: 997,
  maxBronze: 1851,
  drops: [
    { itemId: "chimera-mane", chance: 0.04, minimum: 1, maximum: 1 },
    { itemId: "chimera-fang", chance: 0.04, minimum: 1, maximum: 1 },
  ],
};
