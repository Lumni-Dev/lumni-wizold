// The two ingredients each recipe is set to spend are a fact of the device,
// like the hunt's chosen prey: the engine reads them at the landing of every
// lap, so a looped brew keeps filling the same flask.
export interface BrewPicks {
  first: string;
  second: string;
}

const KEY = "lumni-wizold:alchemy-selection";
const EMPTY: Record<string, BrewPicks> = {};
const listeners = new Set<() => void>();
let cached: Record<string, BrewPicks> | null = null;

function notify(): void {
  listeners.forEach((listener) => listener());
}

function parse(): Record<string, BrewPicks> {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object") return {};
    const clean: Record<string, BrewPicks> = {};
    for (const [potionId, picks] of Object.entries(parsed as Record<string, unknown>)) {
      if (!picks || typeof picks !== "object") continue;
      const { first, second } = picks as { first?: unknown; second?: unknown };
      if (typeof first !== "string" || typeof second !== "string") continue;
      clean[potionId] = { first, second };
    }
    return clean;
  } catch {
    return {};
  }
}

function onStorage(event: StorageEvent): void {
  if (event.key !== KEY && event.key !== null) return;
  cached = parse();
  notify();
}

export function loadBrewPicks(): Record<string, BrewPicks> {
  if (cached) return cached;
  cached = parse();
  return cached;
}

export function saveBrewPicks(picks: Record<string, BrewPicks>): void {
  cached = picks;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(picks));
    } catch {}
  }
  notify();
}

export function subscribeBrewPicks(listener: () => void): () => void {
  if (listeners.size === 0 && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export function brewPicksSnapshot(): Record<string, BrewPicks> {
  return loadBrewPicks();
}

export function brewPicksServerSnapshot(): Record<string, BrewPicks> {
  return EMPTY;
}
