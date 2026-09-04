"use client";

import { useSyncExternalStore } from "react";
import { activityMirrorStore } from "@/controllers/activity-mirror.store";
import { activityRuntimeStore } from "@/controllers/activity-runtime";
import { formatNumber } from "@/shared/utils/format";

export function RestHealed() {
  const healed = useSyncExternalStore(
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
      if (mirror.mirroring && mirror.runtime) return mirror.runtime.restHealed;
      return activityRuntimeStore.snapshot().restHealed;
    },
    () => null,
  );

  if (!healed) return null;
  return <>+{formatNumber(healed.amount)}</>;
}
