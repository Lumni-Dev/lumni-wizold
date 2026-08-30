const STORAGE_KEY = "lumni-wizold:tavern-push";

const listeners = new Set<() => void>();

// The desktop-notification switch for the tavern, a device fact like the sound
// switch. Off by default: the player turns it on and grants permission.
export const tavernPushRepository = {
  enabled(): boolean {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "on";
    } catch {
      return false;
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
    return false;
  },
};
