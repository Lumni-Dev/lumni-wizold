const KEY = "lumni-wizold:session";

export function markSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {}
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {}
}

export function hadSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export const sessionHint = {
  subscribe(callback: () => void): () => void {
    if (typeof window === "undefined") return () => undefined;
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
  },
  snapshot(): boolean {
    return hadSession();
  },
  serverSnapshot(): boolean {
    return false;
  },
};
