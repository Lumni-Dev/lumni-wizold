const STORAGE_KEY = "lumni-wizold:activity-dock";

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export const activityDockRepository = {
  minimized(): boolean {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "min";
    } catch {
      return false;
    }
  },

  setMinimized(minimized: boolean): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, minimized ? "min" : "open");
    } catch {}
    emit();
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  serverSnapshot(): boolean {
    return false;
  },
};
