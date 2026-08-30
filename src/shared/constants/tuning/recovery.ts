// Recuperação (descanso): parado, a cada tick de tickSeconds segundos o corpo
// devolve healthPerTick da vida cheia. Só vida. Hoje: vida cheia em 5 min
// (0,05 x 20 ticks x 15s).
export const RECOVERY = {
  tickSeconds: 15,
  healthPerTick: 0.05,
};
