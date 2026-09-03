"use client";

import { api } from "./api.client";
import type { TavernReadMap, TavernUiState, TavernUserState } from "@/models/entities/tavern";
import { subscribeTavernBoard } from "./tavern-stream";
import type { RoomSummary } from "./tavern.controller";

export type { TavernReadMap, TavernUiState, TavernUserState };

const CLOSED_UI: TavernUiState = {
  roomId: null,
  open: false,
  x: 0,
  y: 0,
};

const readListeners = new Set<() => void>();
const uiListeners = new Set<() => void>();

let readMap: TavernReadMap = {};
let uiState: TavernUiState = CLOSED_UI;

function notifyRead(): void {
  readListeners.forEach((listener) => listener());
}

function notifyUi(): void {
  uiListeners.forEach((listener) => listener());
}

function seedReadFromLegacy(): TavernReadMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem("lumni-wizold:tavern-read");
    if (!raw) return {};
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null || Array.isArray(data)) return {};
    const map: TavernReadMap = {};
    for (const [roomId, at] of Object.entries(data)) {
      if (typeof at === "string") map[roomId] = at;
    }
    return map;
  } catch {
    return {};
  }
}

function seedUiFromLegacy(): TavernUiState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("lumni-wizold:tavern-chat");
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const row = data as Record<string, unknown>;
    if (row.open !== true || typeof row.roomId !== "string") return null;
    const x = typeof row.x === "number" && Number.isFinite(row.x) ? row.x : 0;
    const y = typeof row.y === "number" && Number.isFinite(row.y) ? row.y : 0;
    return { roomId: row.roomId, open: true, x, y };
  } catch {
    return null;
  }
}

async function syncLegacyRead(alive: Iterable<string>): Promise<void> {
  const legacy = seedReadFromLegacy();
  if (Object.keys(legacy).length === 0) return;
  for (const [roomId, at] of Object.entries(legacy)) {
    await api("PATCH", "/api/tavern/read", { roomId, at, alive: [...alive] });
  }
  try {
    window.localStorage.removeItem("lumni-wizold:tavern-read");
  } catch {}
}

async function syncLegacyUi(): Promise<void> {
  const legacy = seedUiFromLegacy();
  if (!legacy) return;
  await api("PATCH", "/api/tavern/ui", legacy);
  try {
    window.localStorage.removeItem("lumni-wizold:tavern-chat");
  } catch {}
}

export const tavernUserStore = {
  readSnapshot(): TavernReadMap {
    return readMap;
  },

  uiSnapshot(): TavernUiState {
    return uiState;
  },

  subscribeRead(listener: () => void): () => void {
    readListeners.add(listener);
    return () => readListeners.delete(listener);
  },

  subscribeUi(listener: () => void): () => void {
    uiListeners.add(listener);
    return () => uiListeners.delete(listener);
  },

  adoptUser(user: TavernUserState, rooms: RoomSummary[]): void {
    readMap = user.read;
    uiState = user.ui;
    notifyRead();
    notifyUi();

    const alive = rooms.map((summary) => summary.room.id);
    if (Object.keys(user.read).length === 0) {
      void syncLegacyRead(alive);
    }
    if (!user.ui.open) {
      void syncLegacyUi();
    }
  },

  markRead(roomId: string, at: string, alive?: Iterable<string>): TavernReadMap | null {
    if ((readMap[roomId] ?? "") >= at) return null;
    const keep = alive ? new Set(alive) : null;
    const next: TavernReadMap = {};
    for (const [id, stamp] of Object.entries({ ...readMap, [roomId]: at })) {
      if (!keep || keep.has(id)) next[id] = stamp;
    }
    readMap = next;
    notifyRead();
    void api("PATCH", "/api/tavern/read", {
      roomId,
      at,
      alive: alive ? [...alive] : undefined,
    });
    return next;
  },

  saveUi(next: TavernUiState): void {
    uiState = next;
    notifyUi();
    void api("PATCH", "/api/tavern/ui", next);
  },
};

export function bindTavernUserSync(): () => void {
  return subscribeTavernBoard((board) => {
    if (board.user) tavernUserStore.adoptUser(board.user, board.rooms);
  });
}
