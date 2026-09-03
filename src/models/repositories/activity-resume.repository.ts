"use client";

import type { Activity } from "@/models/entities/activity";

const KEY = "lumni-wizold:activity-resume";

export function stashActivityResume(activity: Activity | null): void {
  if (typeof sessionStorage === "undefined") return;
  if (!activity || activity.paused || activity.kind === "rest") {
    sessionStorage.removeItem(KEY);
    return;
  }
  sessionStorage.setItem(
    KEY,
    JSON.stringify({
      kind: activity.kind,
      id: activity.id ?? null,
      enhancement: activity.enhancement ?? null,
      beat: activity.beat ?? 0,
      cooldownUntil: activity.cooldownUntil ?? null,
    }),
  );
}

export function readActivityResume(): Activity | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const row = JSON.parse(raw) as Activity;
    if (!row || typeof row.kind !== "string") return null;
    return row;
  } catch {
    return null;
  }
}

export function clearActivityResume(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(KEY);
}

export function mergeActivityResume(server: Activity | null): Activity | null {
  if (!server) {
    clearActivityResume();
    return null;
  }
  if (server.kind === "rest") {
    clearActivityResume();
    return server;
  }
  const stashed = readActivityResume();
  if (
    !stashed ||
    stashed.kind !== server.kind ||
    (stashed.id ?? null) !== (server.id ?? null) ||
    (stashed.enhancement ?? null) !== (server.enhancement ?? null)
  ) {
    stashActivityResume(server);
    return server;
  }
  const merged: Activity = {
    ...server,
    beat: Math.max(server.beat ?? 0, stashed.beat ?? 0),
    cooldownUntil: server.cooldownUntil ?? stashed.cooldownUntil ?? undefined,
  };
  stashActivityResume(merged);
  return merged;
}
