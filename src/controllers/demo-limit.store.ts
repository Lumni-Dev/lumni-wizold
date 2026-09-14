"use client";

import type { DemoAction } from "@/shared/constants/demo";

// Which demo allowances this account has already spent, as told by the server
// (a refusal carrying data.demoLimit). The activity engine reads it before
// parking a refused job as "paused": with the automation switch on, a paused
// job is resumed on the next beat and refused again, a loop of refused
// requests and a modal that never stays closed. A blocked action drops the
// job instead. Cleared whenever the session ends.
const blocked = new Set<DemoAction>();

export function blockDemo(action: DemoAction): void {
  blocked.add(action);
}

export function isDemoBlocked(action: DemoAction): boolean {
  return blocked.has(action);
}

export function clearDemoBlocks(): void {
  blocked.clear();
}
