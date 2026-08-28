export type LogKind =
  "system" | "character" | "training" | "hunt" | "arena" | "market" | "inventory";

export interface LogEntry {
  id: string;
  kind: LogKind;
  message: string;
  date: string;
}

export const LOG_KIND_LABEL: Record<LogKind, string> = {
  system: "Sistema",
  character: "Personagem",
  training: "Treino",
  hunt: "Caça",
  arena: "Arena",
  market: "Mercado",
  inventory: "Inventário",
};

const DIARY_DAYS = 7;

const DAY_MS = 86_400_000;

export function withinDiary(entries: readonly LogEntry[], now = Date.now()): LogEntry[] {
  const since = now - DIARY_DAYS * DAY_MS;
  return entries.filter((entry) => new Date(entry.date).getTime() >= since);
}
