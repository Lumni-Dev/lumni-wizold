// Whether the chat window is folded into the corner is a fact of the device,
// like the activity dock's own minimized state: the seat and the window's
// place travel with the account, but which screen keeps it out of the way
// belongs to the screen.
const MINIMIZED_KEY = "lumni-wizold:chat-dock";

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export const chatDockRepository = {
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
