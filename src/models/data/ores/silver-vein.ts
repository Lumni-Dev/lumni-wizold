import type { Ore } from "./types";

// O veio de Metal (chave "silver"), a partir da mineração NV 10.
export const silverVein: Ore = {
  id: "silver-vein",
  label: "Fragmento de Metal",
  fragmentId: "silver-fragment",
  set: "silver",
  requiredLevel: 10,
  minYield: 1,
  maxYield: 3,
  progress: 45,
};
