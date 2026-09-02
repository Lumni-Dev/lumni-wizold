import type { Creature } from "../types";

// Hidra Jovem (NV. 381 a 390) da área Pântano Pálido.
export const youngHydra: Creature = {
  id: "young-hydra",
  name: "Hidra Jovem",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 381,
  health: 4458,
  strength: 51,
  endurance: 754,
  agility: 138,
  experience: 2714,
  minBronze: 8,
  maxBronze: 14,
  drops: [
    { itemId: "hydra-scale", chance: 0.07, minimum: 1, maximum: 1 },
    { itemId: "hydra-blood", chance: 0.07, minimum: 1, maximum: 1 },
  ],
};
