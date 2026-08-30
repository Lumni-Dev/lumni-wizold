import type { Creature } from "../types";

// Golem de Lava (NV. 741 a 750) da área Abismo Uivante.
export const lavaGolem: Creature = {
  id: "lava-golem",
  name: "Golem de Lava",
  image: "",
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
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
