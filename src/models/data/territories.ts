// Territories are fixed data now: one file per area under areas/, aggregated in
// areas/index. This barrel keeps the legacy names (TERRITORIES, findTerritory) the
// rest of the app already imports.
export { ALL_AREAS as TERRITORIES, findArea as findTerritory } from "./areas/index";
export type { Territory, DangerLevel } from "./areas/index";
