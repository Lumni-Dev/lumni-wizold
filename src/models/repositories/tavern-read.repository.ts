const STORAGE_KEY = "lumni-wizold:tavern-read";

export type TavernReadMap = Record<string, string>;

function load(): TavernReadMap {
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
}

function save(map: TavernReadMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

function mark(roomId: string, at: string, alive?: Iterable<string>): TavernReadMap | null {
  const current = load();
  if ((current[roomId] ?? "") >= at) return null;
  const keep = alive ? new Set(alive) : null;
  const next: TavernReadMap = {};
  for (const [id, stamp] of Object.entries({ ...current, [roomId]: at })) {
    if (!keep || keep.has(id)) next[id] = stamp;
  }
  save(next);
  return next;
}

export const tavernReadRepository = { load, save, mark };
