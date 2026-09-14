import type { PresenceStatus } from "@/models/entities/presence";

import {
  PRESENCE_HEARTBEAT_MS as HEARTBEAT,
  PRESENCE_POLL_MS as POLL,
  PRESENCE_STALE_MS as STALE,
} from "@/shared/constants/polling";

export const PRESENCE_STALE_MS = STALE;
export const PRESENCE_HEARTBEAT_MS = HEARTBEAT;
export const PRESENCE_POLL_MS = POLL;

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
