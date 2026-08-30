// The creature the player is farming in each area: a device fact (localStorage),
// one selected monster per territory, keyed by territory id. It is a preference,
// not run state, so it lives on the device like the sound switch and the mining
// bank, never in the save; the hunt route validates the id against the area anyway.
const KEY = "lumni-wizold:hunt-selection";

export function loadHuntSelection(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object") return {};
    const clean: Record<string, string> = {};
    for (const [territoryId, creatureId] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof creatureId === "string") clean[territoryId] = creatureId;
    }
    return clean;
  } catch {
    return {};
  }
}

export function saveHuntSelection(selection: Record<string, string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(selection));
  } catch {
    // Ignore write failures (private mode, quota): the selection is only a comfort.
  }
}
