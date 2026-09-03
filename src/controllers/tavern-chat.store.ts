import { tavernUserStore } from "./tavern-user.store";

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
    return tavernUserStore.uiSnapshot();
  },

  serverSnapshot(): TavernChatSnapshot {
    return CLOSED;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    const stop = tavernUserStore.subscribeUi(() => {
      listener();
      notify();
    });
    return () => {
      stop();
      listeners.delete(listener);
    };
  },

  openRoom(roomId: string): string | null {
    const current = tavernUserStore.uiSnapshot();
    const previous =
      current.open && current.roomId !== null && current.roomId !== roomId ? current.roomId : null;
    const position = current.open ? { x: current.x, y: current.y } : defaultPosition();
    tavernUserStore.saveUi({ roomId, open: true, x: position.x, y: position.y });
    return previous;
  },

  closeWindow(): void {
    tavernUserStore.saveUi(CLOSED);
  },

  setPosition(x: number, y: number): void {
    const current = tavernUserStore.uiSnapshot();
    if (!current.open || !current.roomId) return;
    tavernUserStore.saveUi({ ...current, x, y });
  },

  isOpenFor(roomId: string): boolean {
    const current = tavernUserStore.uiSnapshot();
    return current.open && current.roomId === roomId;
  },
};
