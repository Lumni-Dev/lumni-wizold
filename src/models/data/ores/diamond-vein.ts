import type { Ore } from "./types";

// O veio de Diamante, a partir da mineração NV 45.
export const diamondVein: Ore = {
  id: "diamond-vein",
  label: "Fragmento de Diamante",
  fragmentId: "diamond-fragment",
  set: "diamond",
  requiredLevel: 601,
  minYield: 1,
  maxYield: 2,
  progress: 260,
};
