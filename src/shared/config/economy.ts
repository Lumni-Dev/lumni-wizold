export const ECONOMY = {
  vipPriceCents: 990,
  startingBronze: 200,
  /** Hunter rename; flat bronze, not scaled by level. */
  renamePriceBronze: 100_000,
  /** Each yard session, in hunts of the character's current band. */
  trainingSessionHunts: 0.4,
} as const;

/** WCoins store packs scale with the current band set, not a flat hunt count. */
export const STORE = {
  /** Flat WCoins each pouch hands over, the same at every level. */
  onePouch: 20_000,
  twoPouches: 80_000,
  threePouches: 200_000,
} as const;
