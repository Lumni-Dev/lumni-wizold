export type PresenceStatus = "active" | "away" | "offline";

export interface MatePresence {
  id: string;
  status: PresenceStatus;
}
