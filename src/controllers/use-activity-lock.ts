"use client";

import { workActivityBlockReason } from "@/models/entities/activity";
import { useVisibleActivity } from "./use-visible-activity";

export const ACTIVITY_WAIT_LABEL = "Wait...";

export function useActivityLock(): { locked: boolean; reason: string } {
  const { activity } = useVisibleActivity();
  const reason = workActivityBlockReason(activity);
  if (!reason) return { locked: false, reason: "" };
  return { locked: true, reason };
}
