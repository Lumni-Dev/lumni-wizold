const STORAGE_KEY = "lumni-wizold:tavern-chat";
const ROOM_ID_MAX = 80;

export interface StoredTavernChat {
  roomId: string;
  open: true;
  x: number;
  y: number;
}

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function load(): StoredTavernChat | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const row = data as Record<string, unknown>;
    if (row.open !== true || typeof row.roomId !== "string") return null;
    const roomId = row.roomId.trim();
    if (roomId.length === 0 || roomId.length > ROOM_ID_MAX) return null;
    const x = finite(row.x);
    const y = finite(row.y);
    if (x === null || y === null) return null;
    return { roomId, open: true, x, y };
  } catch {
    return null;
  }
}

function save(chat: { roomId: string | null; open: boolean; x: number; y: number }): void {
  if (typeof window === "undefined") return;
  try {
    if (!chat.open || !chat.roomId) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const payload: StoredTavernChat = {
      roomId: chat.roomId,
      open: true,
      x: chat.x,
      y: chat.y,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {}
}

export const tavernChatRepository = { load, save };
