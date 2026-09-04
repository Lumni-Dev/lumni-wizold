"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { activityMirrorStore } from "@/controllers/activity-mirror.store";
import { activityRuntimeStore } from "@/controllers/activity-runtime";
import { REST_TICK_MS } from "@/shared/constants/game";

const TICK_SECS = REST_TICK_MS / 1000;

function secondsUntil(nextAt: number | null | undefined): number {
  if (nextAt == null) return TICK_SECS;
  const left = Math.ceil((nextAt - Date.now()) / 1000);
  return left <= 0 ? 1 : left;
}

export function RestSeconds() {
  const nextAt = useSyncExternalStore(
    (listener) => {
      const offRuntime = activityRuntimeStore.subscribe(listener);
      const offMirror = activityMirrorStore.subscribe(listener);
      return () => {
        offRuntime();
        offMirror();
      };
    },
    () => {
      const mirror = activityMirrorStore.snapshot();
      if (mirror.mirroring && mirror.runtime) return mirror.runtime.restNextAt ?? null;
      return activityRuntimeStore.snapshot().restNextAt;
    },
    () => null,
  );
  const [seconds, setSeconds] = useState(() => secondsUntil(nextAt));

  useEffect(() => {
    const sync = () => setSeconds(secondsUntil(nextAt));
    sync();
    const timer = window.setInterval(sync, 250);
    return () => window.clearInterval(timer);
  }, [nextAt]);

  return <>{seconds}</>;
}
