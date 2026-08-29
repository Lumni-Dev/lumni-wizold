export type Random = () => number;

// A float in [0, 1) drawn from the platform CSPRNG when it exists (Node's
// global webcrypto on the server, window.crypto in the browser), so the rolls
// that decide forge success, drops and spoils cannot be predicted from a run
// of observed outputs the way Math.random's xorshift state can. Math.random is
// only the fallback for an ancient runtime; the benches inject seededRandom.
function secureFloat(): number {
  const source = globalThis.crypto;
  if (source && typeof source.getRandomValues === "function") {
    const buffer = new Uint32Array(1);
    source.getRandomValues(buffer);
    return buffer[0] / 4294967296;
  }
  return Math.random();
}

export const defaultRandom: Random = secureFloat;

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
