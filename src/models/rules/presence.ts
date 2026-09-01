import type { PresenceStatus } from "@/models/entities/presence";

export const PRESENCE_STALE_MS = 45000;
export const PRESENCE_HEARTBEAT_MS = 20000;
export const PRESENCE_POLL_MS = 30000;

export function resolvePresence(
  status: PresenceStatus | null,
  at: string | null,
  now = Date.now(),
): PresenceStatus {
  if (!status || !at || status === "offline") return "offline";
  if (now - Date.parse(at) > PRESENCE_STALE_MS) return "offline";
  return status;
}

export function parsePresenceStatus(value: unknown): PresenceStatus | null {
  return value === "active" || value === "away" || value === "offline" ? value : null;
}
