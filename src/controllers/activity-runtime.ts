"use client";

import type { ActivityKind } from "@/models/entities/activity";
import type { CombatOutcome } from "@/models/rules/combat";
import type { HuntReport } from "./hunt.controller";
import type { NarrationLine } from "@/views/presenters/hunt.presenter";

export type ActivityBarTone = "blood" | "tide" | "ember" | "vigor";

export interface ActivityDockView {
  kind: ActivityKind;
  title: string;
  detail: string;
  beat: number;
  max: number;
  cooldown: number | null;
  tone: ActivityBarTone;
  href: string;
  canStop: boolean;
}

export interface HuntFoeSnapshot {
  name: string;
  health: number;
  combat: CombatOutcome;
}

export interface HuntRuntime {
  territoryId: string;
  beat: number;
  script: NarrationLine[];
  pending: HuntReport | null;
  cooldown: number | null;
  lastFoe?: HuntFoeSnapshot | null;
}

export interface CycleRuntime {
  id: string;
  beat: number;
  max: number;
  cooldown: number | null;
}

export interface ForgeRuntime extends CycleRuntime {
  level: number;
}

export interface ActivityRuntimeSnapshot {
  dock: ActivityDockView | null;
  hunt: HuntRuntime | null;
  train: CycleRuntime | null;
  mine: CycleRuntime | null;
  forge: ForgeRuntime | null;
  lastHuntReport: HuntReport | null;
}

export function activityHref(kind: ActivityKind): string {
  if (kind === "hunt") return "/hunt";
  if (kind === "train") return "/training";
  if (kind === "mine" || kind === "forge") return "/forge";
  return "/character";
}

export function activityTone(kind: ActivityKind): ActivityBarTone {
  if (kind === "hunt") return "blood";
  if (kind === "train") return "ember";
  if (kind === "mine") return "ember";
  if (kind === "forge") return "ember";
  return "blood";
}

const EMPTY: ActivityRuntimeSnapshot = {
  dock: null,
  hunt: null,
  train: null,
  mine: null,
  forge: null,
  lastHuntReport: null,
};

let snapshot: ActivityRuntimeSnapshot = EMPTY;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function publishActivityRuntime(next: ActivityRuntimeSnapshot): void {
  snapshot = next;
  emit();
}

export function patchActivityRuntime(patch: Partial<ActivityRuntimeSnapshot>): void {
  publishActivityRuntime({ ...snapshot, ...patch });
}

export function clearActivityRuntime(): void {
  if (
    snapshot.dock === null &&
    snapshot.hunt === null &&
    snapshot.train === null &&
    snapshot.mine === null &&
    snapshot.forge === null &&
    snapshot.lastHuntReport === null
  ) {
    return;
  }
  publishActivityRuntime(EMPTY);
}

export const activityRuntimeStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  snapshot(): ActivityRuntimeSnapshot {
    return snapshot;
  },
  serverSnapshot(): ActivityRuntimeSnapshot {
    return EMPTY;
  },
};
