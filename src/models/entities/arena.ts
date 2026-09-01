import { ARENA } from "@/shared/config/arena";

export type ArenaOutcome = "victory" | "draw" | "defeat";

export interface ArenaHistoryEntry {
  id: string;
  challengerId: string;
  challengerName: string;
  rivalId: string;
  rivalName: string;
  outcome: ArenaOutcome;
  spoils: number;
  at: string;
}

export const ARENA_HISTORY_SIZE = ARENA.historySize;
