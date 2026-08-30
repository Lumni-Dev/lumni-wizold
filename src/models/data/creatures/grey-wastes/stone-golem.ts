import type { Creature } from "../types";

// Golem de Pedra (NV. 571 a 580) da área Ermo Cinza.
export const stoneGolem: Creature = {
  id: "stone-golem",
  name: "Golem de Pedra",
  image: "/assets/creatures/grey-wastes/stone-golem.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 571,
  health: 22392,
  strength: 102,
  endurance: 2849,
  agility: 204,
  experience: 4044,
  minBronze: 330,
  maxBronze: 612,
  drops: [
    { itemId: "golem-core", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "stone-shard", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
