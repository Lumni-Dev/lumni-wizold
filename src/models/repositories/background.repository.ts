const ENABLED_KEY = "lumni-wizold:background";
const DARKNESS_KEY = "lumni-wizold:background:darkness";
const DEFAULT_DARKNESS = 1;

const listeners = new Set<() => void>();

function clampDarkness(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_DARKNESS;
  return Math.max(0, Math.min(1, value));
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

function seedDefaults(): void {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(ENABLED_KEY) === null) {
      window.localStorage.setItem(ENABLED_KEY, "on");
    }
    if (window.localStorage.getItem(DARKNESS_KEY) === null) {
      window.localStorage.setItem(DARKNESS_KEY, String(DEFAULT_DARKNESS));
    }
  } catch {}
}

export const backgroundRepository = {
  seedDefaults,

  enabled(): boolean {
    if (typeof window === "undefined") return true;
    try {
      return window.localStorage.getItem(ENABLED_KEY) !== "off";
    } catch {
      return true;
    }
  },

  darkness(): number {
    if (typeof window === "undefined") return DEFAULT_DARKNESS;
    try {
      const raw = window.localStorage.getItem(DARKNESS_KEY);
      if (raw === null) return DEFAULT_DARKNESS;
      return clampDarkness(Number(raw));
    } catch {
      return DEFAULT_DARKNESS;
    }
  },

  setEnabled(on: boolean): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(ENABLED_KEY, on ? "on" : "off");
    } catch {}
    notify();
  },

  setDarkness(value: number): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(DARKNESS_KEY, String(clampDarkness(value)));
    } catch {}
    notify();
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  serverSnapshot(): boolean {
    return true;
  },

  serverDarknessSnapshot(): number {
    return DEFAULT_DARKNESS;
  },
};
