export type Random = () => number;

export const defaultRandom: Random = () => Math.random();

export function intBetween(
  minimum: number,
  maximum: number,
  random: Random = defaultRandom,
): number {
  const lower = Math.ceil(Math.min(minimum, maximum));
  const upper = Math.floor(Math.max(minimum, maximum));
  return lower + Math.floor(random() * (upper - lower + 1));
}

export function chance(probability: number, random: Random = defaultRandom): boolean {
  return random() < probability;
}

export function pickOne<T>(list: readonly T[], random: Random = defaultRandom): T {
  return list[Math.floor(random() * list.length)];
}

export function spread(amplitude: number, random: Random = defaultRandom): number {
  return 1 - amplitude + random() * amplitude * 2;
}

export function seededRandom(seed: number): Random {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
