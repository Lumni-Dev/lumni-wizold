import type { Creature } from "../types";

export const youngHydra: Creature = {
  id: "young-hydra",
  name: "Young Hydra",
  description: "Territorial and slow to give up. One blow is enough to crack a rib.",
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
