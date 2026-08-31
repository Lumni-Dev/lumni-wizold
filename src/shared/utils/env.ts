export function numberFromEnv(raw: string | undefined, fallback: number): number {
  const value = raw === undefined || raw === "" ? NaN : Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}

function parseNumber(part: string): number {
  const slash = part.indexOf("/");
  if (slash >= 0) {
    const numerator = Number(part.slice(0, slash));
    const denominator = Number(part.slice(slash + 1));
    return denominator !== 0 ? numerator / denominator : NaN;
  }
  return Number(part);
}

export function numbersFromEnv(raw: string | undefined, fallback: readonly number[]): number[] {
  if (raw === undefined) return [...fallback];
  const cleaned = raw.trim().replace(/^["']|["']$/g, "").trim();
  if (cleaned === "") return [...fallback];
  const parsed = cleaned.split(",").map((part) => parseNumber(part.trim()));
  return parsed.length > 0 && parsed.every((value) => Number.isFinite(value))
    ? parsed
    : [...fallback];
}
