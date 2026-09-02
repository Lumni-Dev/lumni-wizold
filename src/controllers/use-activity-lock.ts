"use client";

import { useSyncExternalStore } from "react";
import { activityRuntimeStore } from "./activity-runtime";
import { activityMirrorStore } from "./activity-sync";
import { useGame } from "./game.context";

const LABEL: Record<string, string> = {
  hunt: "Caçada em andamento",
  train: "Treino em andamento",
  mine: "Mineração em andamento",
  forge: "Forja em andamento",
  rest: "Recuperação em andamento",
};

export const ACTIVITY_WAIT_LABEL = "Aguarde...";

export function useActivityLock(): { locked: boolean; reason: string } {
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

  const dock = runtime.dock;
  const running = activity ?? mirror?.activity ?? null;
  if (running === null || dock === null || dock.canStop) return { locked: false, reason: "" };

  return {
    locked: true,
    reason: (LABEL[running.kind] ?? "Atividade em andamento") + ": espere a volta terminar.",
  };
}
