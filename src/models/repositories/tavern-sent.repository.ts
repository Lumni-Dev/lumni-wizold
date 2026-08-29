const STORAGE_KEY = "lumni-wizold:tavern-sent";
const MARKER_LIFETIME_MS = 60000;

export type TavernSentMap = Record<string, number>;

export const tavernSentRepository = {
  load(): TavernSentMap {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const data: unknown = JSON.parse(raw);
      if (typeof data !== "object" || data === null || Array.isArray(data)) return {};
      const map: TavernSentMap = {};
      for (const [roomId, at] of Object.entries(data)) {
        if (typeof at === "number" && Number.isFinite(at)) map[roomId] = at;
      }
      return map;
    } catch {
      return {};
    }
  },

  save(map: TavernSentMap): void {
    if (typeof window === "undefined") return;
    try {
      const fresh: TavernSentMap = {};
      for (const [roomId, at] of Object.entries(map)) {
        if (Date.now() - at < MARKER_LIFETIME_MS) fresh[roomId] = at;
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {}
  },
};
