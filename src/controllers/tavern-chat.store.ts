export interface TavernChatSnapshot {
  roomId: string | null;
  open: boolean;
  x: number;
  y: number;
}

const listeners = new Set<() => void>();

let state: TavernChatSnapshot = {
  roomId: null,
  open: false,
  x: 0,
  y: 0,
};

function notify(): void {
  listeners.forEach((listener) => listener());
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
    return state;
  },

  serverSnapshot(): TavernChatSnapshot {
    return { roomId: null, open: false, x: 0, y: 0 };
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  openRoom(roomId: string): void {
    const position = defaultPosition();
    state = { roomId, open: true, x: position.x, y: position.y };
    notify();
  },

  closeWindow(): void {
    state = { roomId: null, open: false, x: 0, y: 0 };
    notify();
  },

  setPosition(x: number, y: number): void {
    if (!state.open) return;
    state = { ...state, x, y };
    notify();
  },

  isOpenFor(roomId: string): boolean {
    return state.open && state.roomId === roomId;
  },
};
