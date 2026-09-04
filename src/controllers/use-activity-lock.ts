"use client";

import { useVisibleActivity } from "./use-visible-activity";

const LABEL: Record<string, string> = {
  hunt: "Caçada em andamento",
  train: "Treino em andamento",
  mine: "Mineração em andamento",
  forge: "Forja em andamento",
  rest: "Recuperação em andamento",
};

export const ACTIVITY_WAIT_LABEL = "Aguarde...";

export function useActivityLock(): { locked: boolean; reason: string } {
  const { activity, runtime } = useVisibleActivity();
  const dock = runtime.dock;
  if (activity === null || dock === null || dock.canStop) return { locked: false, reason: "" };

  return {
    locked: true,
    reason: (LABEL[activity.kind] ?? "Atividade em andamento") + ": espere a volta terminar.",
  };
}
