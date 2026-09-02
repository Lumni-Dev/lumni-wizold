import { tavernChatRepository } from "@/models/repositories/tavern-chat.repository";

export interface TavernChatSnapshot {
  roomId: string | null;
  open: boolean;
  x: number;
  y: number;
}

const CLOSED: TavernChatSnapshot = {
  roomId: null,
  open: false,
  x: 0,
  y: 0,
};

const listeners = new Set<() => void>();

let state: TavernChatSnapshot = CLOSED;
let hydrated = false;

function notify(): void {
  listeners.forEach((listener) => listener());
}

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const saved = tavernChatRepository.load();
  if (saved) state = saved;
}

function write(next: TavernChatSnapshot): void {
  state = next;
  tavernChatRepository.save(next);
  notify();
}

function defaultPosition(): { x: number; y: number } {
  if (typeof window === "undefined") return { x: 24, y: 24 };
  const width = Math.min(512, window.innerWidth - 48);
  const height = 420;
  return {
    x: Math.max(16, window.innerWidth - width - 24),
    y: Math.max(16, Math.round((window.innerHeight - height) / 2)),
  };
}

export const tavernChatStore = {
  snapshot(): TavernChatSnapshot {
    hydrate();
    return state;
  },

  serverSnapshot(): TavernChatSnapshot {
    return CLOSED;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  openRoom(roomId: string): string | null {
    hydrate();
    const previous =
      state.open && state.roomId !== null && state.roomId !== roomId ? state.roomId : null;
    const position = state.open ? { x: state.x, y: state.y } : defaultPosition();
    write({ roomId, open: true, x: position.x, y: position.y });
    return previous;
  },

  closeWindow(): void {
    hydrate();
    write(CLOSED);
  },

  setPosition(x: number, y: number): void {
    hydrate();
    if (!state.open) return;
    write({ ...state, x, y });
  },

  isOpenFor(roomId: string): boolean {
    hydrate();
    return state.open && state.roomId === roomId;
  },
};
