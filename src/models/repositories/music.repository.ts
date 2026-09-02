const ENABLED_KEY = "lumni-wizold:music";
const VOLUME_KEY = "lumni-wizold:music:volume";
const DEFAULT_VOLUME = 0.35;

const listeners = new Set<() => void>();

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_VOLUME;
  return Math.max(0, Math.min(1, value));
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

export const musicRepository = {
  enabled(): boolean {
    if (typeof window === "undefined") return true;
    try {
      return window.localStorage.getItem(ENABLED_KEY) !== "off";
    } catch {
      return true;
    }
  },

  volume(): number {
    if (typeof window === "undefined") return DEFAULT_VOLUME;
    try {
      const raw = window.localStorage.getItem(VOLUME_KEY);
      if (raw === null) return DEFAULT_VOLUME;
      return clampVolume(Number(raw));
    } catch {
      return DEFAULT_VOLUME;
    }
  },

  setEnabled(on: boolean): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(ENABLED_KEY, on ? "on" : "off");
    } catch {}
    notify();
  },

  setVolume(value: number): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(VOLUME_KEY, String(clampVolume(value)));
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

  serverVolumeSnapshot(): number {
    return DEFAULT_VOLUME;
  },
};
