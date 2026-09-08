const COLLAPSED_KEY = "lumni-wizold:aside";

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export const asideRepository = {
  collapsed(): boolean {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(COLLAPSED_KEY) === "icons";
    } catch {
      return false;
    }
  },

  setCollapsed(on: boolean): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(COLLAPSED_KEY, on ? "icons" : "full");
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
