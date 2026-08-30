// Recuperação (descanso): parado, a cada tick de tickSeconds segundos o corpo
// devolve healthPerTick da vida cheia e ragePerTick da fúria cheia.
// Hoje: vida cheia em 5 min (0,05 x 20 ticks x 15s), fúria cheia em 2,5 min.
export const RECOVERY = {
  tickSeconds: 15,
  healthPerTick: 0.05,
  ragePerTick: 0.1,
};
