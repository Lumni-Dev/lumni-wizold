export function numberFromEnv(raw: string | undefined, fallback: number): number {
  const value = raw === undefined || raw === "" ? NaN : Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}
