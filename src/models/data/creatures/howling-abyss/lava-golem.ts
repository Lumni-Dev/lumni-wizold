import type { Creature } from "../types";

// Golem de Lava (NV. 741 a 750) da área Abismo Uivante.
export const lavaGolem: Creature = {
  id: "lava-golem",
  name: "Golem de Lava",
  image: "/assets/creatures/howling-abyss/lava-golem.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 741,
  health: 89645,
  strength: 205,
  endurance: 11406,
  agility: 264,
  experience: 5234,
  minBronze: 2227,
  maxBronze: 4137,
  drops: [
    { itemId: "lava-core", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "molten-rock", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
