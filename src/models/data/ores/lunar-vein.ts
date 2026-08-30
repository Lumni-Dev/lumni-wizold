import type { Ore } from "./types";

// O último veio, Lunar, a partir da mineração NV 70 (o teto da mineração).
export const lunarVein: Ore = {
  id: "lunar-vein",
  label: "Fragmento Lunar",
  fragmentId: "lunar-fragment",
  set: "lunar",
  requiredLevel: 70,
  minYield: 1,
  maxYield: 2,
  progress: 520,
};
