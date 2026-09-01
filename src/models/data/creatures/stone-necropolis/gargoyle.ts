import type { Creature } from "../types";

// Gárgula (NV. 671 a 680) da área Necrópole de Pedra.
export const gargoyle: Creature = {
  id: "gargoyle",
  name: "Gárgula",
  image: "/assets/creatures/stone-necropolis/gargoyle.png",
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
