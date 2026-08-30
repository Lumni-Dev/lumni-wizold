import type { Ore } from "./types";

// O veio de Ouro, a partir da mineração NV 25.
export const goldVein: Ore = {
  id: "gold-vein",
  label: "Fragmento de Ouro",
  fragmentId: "gold-fragment",
  set: "gold",
  requiredLevel: 25,
  minYield: 1,
  maxYield: 2,
  progress: 120,
};
