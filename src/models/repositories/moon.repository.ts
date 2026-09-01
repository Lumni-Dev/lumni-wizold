import {
  applyMoonState,
  computeMoonLocally,
  findMoonPhase,
  illuminationFromAge,
  isWaxing,
  type MoonPhaseKey,
  type MoonState,
} from "../rules/moon";

interface MoonResponse {
  phase?: string;
  age?: number;
  illumination?: number | null;
  waxing?: boolean;
  source?: string;
}

const PHASE_KEYS: readonly MoonPhaseKey[] = ["new", "waxing", "full", "waning"];

function isPhaseKey(value: unknown): value is MoonPhaseKey {
  return typeof value === "string" && (PHASE_KEYS as readonly string[]).includes(value);
}

const REFRESH_MS = 10 * 60 * 1000;

let snapshot: MoonState = computeMoonLocally();
applyMoonState(snapshot);
const listeners = new Set<() => void>();
let timer: number | null = null;

function notify(): void {
  for (const listener of listeners) listener();
}

async function read(): Promise<MoonState> {
  let state: MoonState;
  try {
    const response = await fetch("/api/moon", { method: "POST" });
    if (!response.ok) throw new Error("resposta " + response.status);

    const data: MoonResponse = await response.json();
    if (!isPhaseKey(data.phase) || typeof data.age !== "number") {
      throw new Error("formato inesperado");
    }

    state = {
      phase: findMoonPhase(data.phase),
      age: data.age,
      illumination:
        typeof data.illumination === "number" ? data.illumination : illuminationFromAge(data.age),
      waxing: typeof data.waxing === "boolean" ? data.waxing : isWaxing(data.age),
      source: data.source === "api" ? "api" : "local",
    };
  } catch {
    state = computeMoonLocally();
  }

  applyMoonState(state);
  if (
    state.phase.key !== snapshot.phase.key ||
    state.source !== snapshot.source ||
    state.age !== snapshot.age
  ) {
    snapshot = state;
    notify();
  }
  return snapshot;
}

export const moonRepository = {
  async load(): Promise<MoonState> {
    return read();
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    if (listeners.size === 1) {
      void read();
      timer = window.setInterval(() => void read(), REFRESH_MS);
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };
  },

  snapshot(): MoonState {
    return snapshot;
  },

  serverSnapshot(): MoonState {
    return snapshot;
  },
};
