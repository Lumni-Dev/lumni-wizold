const STORAGE_KEY = "lumni-wizold:tavern-read";

export type TavernReadMap = Record<string, string>;

export const tavernReadRepository = {
  load(): TavernReadMap {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
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
  },

  save(map: TavernReadMap): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {}
  },
};
