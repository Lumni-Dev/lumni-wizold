import type { Creature } from "../types";

// Hidra Jovem (NV. 381 a 390) da área Pântano Pálido.
export const youngHydra: Creature = {
  id: "young-hydra",
  name: "Hidra Jovem",
  image: "",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 381,
  health: 1990,
  strength: 316,
  endurance: 260,
  agility: 138,
  experience: 2714,
  minBronze: 260,
  maxBronze: 482,
  drops: [
    { itemId: "bear-claw", chance: 0.188, minimum: 1, maximum: 2 },
    { itemId: "bear-fat", chance: 0.09, minimum: 1, maximum: 2 },
  ],
};
