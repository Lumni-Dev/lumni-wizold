const MINIMIZED_KEY = "lumni-wizold:dock";

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export const dockRepository = {
  minimized(): boolean {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(MINIMIZED_KEY) === "min";
    } catch {
      return false;
    }
  },

  setMinimized(on: boolean): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(MINIMIZED_KEY, on ? "min" : "full");
    } catch {}
    notify();
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  serverSnapshot(): boolean {
    return false;
  },
};
