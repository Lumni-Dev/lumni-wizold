"use client";

import { useVisibleActivity } from "./use-visible-activity";

const LABEL: Record<string, string> = {
  hunt: "Hunt in progress",
  train: "Training in progress",
  mine: "Mining in progress",
  forge: "Forge in progress",
  rest: "Recovery in progress",
};

export const ACTIVITY_WAIT_LABEL = "Wait...";

export function useActivityLock(): { locked: boolean; reason: string } {
  const { activity, runtime } = useVisibleActivity();
  const dock = runtime.dock;
  if (activity === null || dock === null || dock.canStop) return { locked: false, reason: "" };

  return {
    locked: true,
    reason: (LABEL[activity.kind] ?? "Activity in progress") + ": wait for the lap to finish.",
  };
}
