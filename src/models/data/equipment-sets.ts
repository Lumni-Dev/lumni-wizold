// Equipment is split by set under equipment/: one file per set (bronze, silver,
// gold, diamond, lunar), the shared slot blueprint in slots.ts, and the build
// logic in index.ts. This barrel keeps the import path the rest of the app uses.
export * from "./equipment/index";
