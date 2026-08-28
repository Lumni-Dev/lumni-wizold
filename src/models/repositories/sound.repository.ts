const STORAGE_KEY = "lumni-wizold:sound";

const listeners = new Set<() => void>();

export const soundRepository = {
  enabled(): boolean {
    if (typeof window === "undefined") return true;
    try {
      return window.localStorage.getItem(STORAGE_KEY) !== "off";
    } catch {
      return true;
    }
  },

  setEnabled(on: boolean): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
    } catch {}
    listeners.forEach((listener) => listener());
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  serverSnapshot(): boolean {
    return true;
  },
};
