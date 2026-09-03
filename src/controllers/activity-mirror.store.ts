"use client";

import type { Activity } from "@/models/entities/activity";
import type { ActivityRuntimeSnapshot } from "./activity-runtime";

export interface ActivityMirrorSnapshot {
  mirroring: boolean;
  activity: Activity | null;
  runtime: ActivityRuntimeSnapshot | null;
}

const EMPTY: ActivityMirrorSnapshot = {
  mirroring: false,
  activity: null,
  runtime: null,
};

let snapshot: ActivityMirrorSnapshot = EMPTY;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export const activityMirrorStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  snapshot(): ActivityMirrorSnapshot {
    return snapshot;
  },

  serverSnapshot(): ActivityMirrorSnapshot {
    return EMPTY;
  },

  isMirroring(): boolean {
    return snapshot.mirroring;
  },

  setMirror(activity: Activity | null, runtime: ActivityRuntimeSnapshot | null): void {
    snapshot = { mirroring: true, activity, runtime };
    emit();
  },

  patchRuntime(runtime: ActivityRuntimeSnapshot | null): void {
    if (!snapshot.mirroring) return;
    snapshot = { ...snapshot, runtime };
    emit();
  },

  clear(): void {
    if (!snapshot.mirroring) return;
    snapshot = EMPTY;
    emit();
  },
};
