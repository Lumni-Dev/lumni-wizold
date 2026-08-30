import type { Ore } from "./types";

// O primeiro veio, minerado a partir da mineração NV 1.
export const bronzeVein: Ore = {
  id: "bronze-vein",
  label: "Fragmento de Bronze",
  fragmentId: "bronze-fragment",
  set: "bronze",
  requiredLevel: 1,
  minYield: 1,
  maxYield: 3,
  progress: 10,
};
