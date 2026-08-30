"use client";

import type { ReactNode } from "react";
import { useGame } from "@/controllers/game.context";
import { MIN_HEALTH_RATIO_TO_ACT } from "@/shared/constants/game";
import { RecoveryButton } from "./recovery-button";

export function BodyGate({
  open,
  reason,
  children,
}: {
  open: boolean;
  reason: string;
  children: ReactNode;
}) {
  const { character, stats, activity, setActivity, rest } = useGame();
  if (!character || !stats || !open) return <>{children}</>;

  const lowHealth = character.health <= stats.maxHealth * MIN_HEALTH_RATIO_TO_ACT;
  if (!lowHealth) return <>{children}</>;

  return (
    <RecoveryButton
      recovering={activity?.kind === "rest"}
      beat={String(character.health)}
      recoveringLabel="Recuperando-se..."
      label="Recuperar-se"
      tooltip={"Vida baixa demais. " + reason}
      onClick={activity?.kind === "rest" ? () => setActivity(null) : rest}
    />
  );
}
