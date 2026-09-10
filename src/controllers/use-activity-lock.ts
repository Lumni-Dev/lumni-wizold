"use client";

import { gearChangeBlockReason, workActivityBlockReason } from "@/models/entities/activity";
import { useVisibleActivity } from "./use-visible-activity";

export const ACTIVITY_WAIT_LABEL = "Wait...";

export function useActivityLock(): { locked: boolean; reason: string } {
  const { activity } = useVisibleActivity();
  const reason = workActivityBlockReason(activity);
  if (!reason) return { locked: false, reason: "" };
  return { locked: true, reason };
}

// The same lock, worded for the body instead of for the slot: the button that
// takes a piece off reads the running job through the very mirror every other
// screen reads, so a job started in another tab closes this one's gear too.
export function useGearLock(): { locked: boolean; reason: string } {
  const { activity } = useVisibleActivity();
  const reason = gearChangeBlockReason(activity);
  if (!reason) return { locked: false, reason: "" };
  return { locked: true, reason };
}
