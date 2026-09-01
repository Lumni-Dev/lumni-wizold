const ENABLED_KEY = "lumni-wizold:background";
const DARKNESS_KEY = "lumni-wizold:background:darkness";
const DEFAULT_DARKNESS = 0.5;

const listeners = new Set<() => void>();

function clampDarkness(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_DARKNESS;
  return Math.max(0, Math.min(1, value));
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

export const backgroundRepository = {
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
