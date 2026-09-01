const ENABLED_KEY = "lumni-wizold:background";

const listeners = new Set<() => void>();

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

  setEnabled(on: boolean): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(ENABLED_KEY, on ? "on" : "off");
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
};
