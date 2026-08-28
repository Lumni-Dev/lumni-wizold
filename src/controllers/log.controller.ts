import { LOG_LIMIT } from "@/shared/constants/game";
import { generateId } from "@/shared/utils/id";
import type { GameState } from "@/models/entities/game-state";
import { withinDiary, type LogEntry, type LogKind } from "@/models/entities/log-entry";

export function addLog(state: GameState, kind: LogKind, message: string): GameState {
  const entry: LogEntry = {
    id: generateId("log"),
    kind,
    message,
    date: new Date().toISOString(),
  };

  const kept = withinDiary([entry, ...state.log]).slice(0, LOG_LIMIT);

  return { ...state, log: kept };
}
