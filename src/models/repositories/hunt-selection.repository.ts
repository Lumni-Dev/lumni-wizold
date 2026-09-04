const KEY = "lumni-wizold:hunt-selection";
const EMPTY: Record<string, string> = {};
const listeners = new Set<() => void>();
let cached: Record<string, string> | null = null;

function notify(): void {
  listeners.forEach((listener) => listener());
}

function parse(): Record<string, string> {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object") return {};
    const clean: Record<string, string> = {};
    for (const [territoryId, creatureId] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof creatureId === "string") clean[territoryId] = creatureId;
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

export function loadHuntSelection(): Record<string, string> {
  if (cached) return cached;
  cached = parse();
  return cached;
}

export function saveHuntSelection(selection: Record<string, string>): void {
  cached = selection;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(selection));
    } catch {
    }
  }
  notify();
}

export function subscribeHuntSelection(listener: () => void): () => void {
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

export function huntSelectionSnapshot(): Record<string, string> {
  return loadHuntSelection();
}

export function huntSelectionServerSnapshot(): Record<string, string> {
  return EMPTY;
}
