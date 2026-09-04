import type { Creature } from "../types";

export const deadKnight: Creature = {
  id: "dead-knight",
  name: "Cavaleiro Morto",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 641,
  health: 48400,
  strength: 150,
  endurance: 6159,
  agility: 229,
  experience: 4534,
  minBronze: 11,
  maxBronze: 21,
  drops: [
    { itemId: "cursed-plate", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "bone-shard", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
