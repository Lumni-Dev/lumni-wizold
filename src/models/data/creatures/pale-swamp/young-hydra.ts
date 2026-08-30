import type { Creature } from "../types";

export const youngHydra: Creature = {
  id: "young-hydra",
  name: "Hidra Jovem",
  image: "/assets/creatures/pale-swamp/young-hydra.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 381,
  health: 4458,
  strength: 51,
  endurance: 754,
  agility: 138,
  experience: 2714,
  minBronze: 223,
  maxBronze: 415,
  drops: [
    { itemId: "hydra-scale", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "hydra-blood", chance: 0.07, minimum: 1, maximum: 1 },
  ],
};
