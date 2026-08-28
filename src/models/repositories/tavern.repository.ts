import { emptyTavern, TAVERN_VERSION, type TavernState } from "../entities/tavern";

const STORAGE_KEY = "lumni-wizold:tavern";
const CHANNEL_NAME = "lumni-wizold:tavern";

const SERVER_SNAPSHOT: TavernState = emptyTavern();

let cache: TavernState = SERVER_SNAPSHOT;
let channel: BroadcastChannel | null = null;
let started = false;
const listeners = new Set<() => void>();

function available(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isValid(data: unknown): data is TavernState {
  if (typeof data !== "object" || data === null) return false;
  const state = data as Partial<TavernState>;
  return state.version === TAVERN_VERSION && Array.isArray(state.rooms);
}

function readFromStorage(): TavernState {
  if (!available()) return SERVER_SNAPSHOT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyTavern();
    const data: unknown = JSON.parse(raw);
    return isValid(data) ? data : emptyTavern();
  } catch {
    return emptyTavern();
  }
}

function notify(): void {
  for (const listener of listeners) listener();
}

function start(): void {
  if (started || !available()) return;
  started = true;
  cache = readFromStorage();
  notify();

  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    cache = readFromStorage();
    notify();
  });

  if (typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = () => {
      cache = readFromStorage();
      notify();
    };
  }
}

export const tavernRepository = {
  snapshot(): TavernState {
    return cache;
  },

  serverSnapshot(): TavernState {
    return SERVER_SNAPSHOT;
  },

  subscribe(listener: () => void): () => void {
    start();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  clear(): void {
    cache = emptyTavern();
    if (available()) {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
    channel?.postMessage("changed");
    notify();
  },

  save(state: TavernState): void {
    cache = state;
    if (available()) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {}
    }
    channel?.postMessage("changed");
    notify();
  },
};
