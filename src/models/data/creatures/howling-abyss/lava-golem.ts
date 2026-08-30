import type { Creature } from "../types";

// Golem de Lava (NV. 741 a 750) da área Abismo Uivante.
export const lavaGolem: Creature = {
  id: "lava-golem",
  name: "Golem de Lava",
  image: "/assets/creatures/howling-abyss/lava-golem.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 741,
  health: 10816,
  strength: 1626,
  endurance: 1419,
  agility: 264,
  experience: 5234,
  minBronze: 1164,
  maxBronze: 2162,
  drops: [
    { itemId: "lava-core", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "molten-rock", chance: 0.12, minimum: 1, maximum: 1 },
  ],
};
