// The creature catalog is fixed data now: one file per creature under creatures/,
// ten per area, aggregated in creatures/index. This barrel keeps the legacy names
// (CREATURES, findCreature) the rest of the app already imports.
export { ALL_CREATURES as CREATURES, findCreature } from "./creatures/index";
export type { Creature, CreatureDrop } from "./creatures/index";
