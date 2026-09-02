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
  /** About one market piece of the band set. */
  onePieceShare: 1 / 7,
  /** Most of a band set; enough to pivot mid-band without stopping training. */
  midSetShare: 0.58,
  /** Full band set plus forge headroom. */
  fullSetShare: 1.5,
} as const;
