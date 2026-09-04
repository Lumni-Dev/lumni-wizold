"use client";

import { useSyncExternalStore } from "react";
import type { Activity } from "@/models/entities/activity";
import { activityMirrorStore } from "./activity-mirror.store";
import { activityRuntimeStore, type ActivityRuntimeSnapshot } from "./activity-runtime";
import { useGame } from "./game.context";

export function useVisibleActivity(): {
  activity: Activity | null;
  runtime: ActivityRuntimeSnapshot;
  mirroring: boolean;
} {
  const { activity } = useGame();
  const runtime = useSyncExternalStore(
    activityRuntimeStore.subscribe,
    activityRuntimeStore.snapshot,
    activityRuntimeStore.serverSnapshot,
  );
  const mirror = useSyncExternalStore(
    activityMirrorStore.subscribe,
    activityMirrorStore.snapshot,
    activityMirrorStore.serverSnapshot,
  );
  if (mirror.mirroring && mirror.activity !== null) {
    return {
      activity: mirror.activity,
      runtime: mirror.runtime ?? runtime,
      mirroring: true,
    };
  }
  return { activity, runtime, mirroring: false };
}
