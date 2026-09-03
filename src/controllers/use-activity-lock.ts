"use client";

import { useSyncExternalStore } from "react";
import { activityMirrorStore } from "./activity-mirror.store";
import { activityRuntimeStore } from "./activity-runtime";
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

  const running =
    mirror.mirroring && mirror.activity !== null ? mirror.activity : activity;
  const dockRuntime =
    mirror.mirroring && mirror.runtime !== null ? mirror.runtime : runtime;
  const dock = dockRuntime.dock;
  if (running === null || dock === null || dock.canStop) return { locked: false, reason: "" };

  return {
    locked: true,
    reason: (LABEL[running.kind] ?? "Atividade em andamento") + ": espere a volta terminar.",
  };
}
