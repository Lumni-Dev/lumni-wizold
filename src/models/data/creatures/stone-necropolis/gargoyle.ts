import type { Creature } from "../types";

export const gargoyle: Creature = {
  id: "gargoyle",
  name: "Gárgula",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 671,
  health: 60784,
  strength: 169,
  endurance: 7735,
  agility: 239,
  experience: 4744,
  minBronze: 12,
  maxBronze: 22,
  drops: [
    { itemId: "gargoyle-stone", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "stone-shard", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
