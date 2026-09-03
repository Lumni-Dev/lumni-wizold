"use client";

import type { ReactNode } from "react";
import { useGame } from "@/controllers/game.context";
import { MIN_HEALTH_RATIO_TO_ACT } from "@/shared/constants/game";
import { RecoveryButton } from "./recovery-button";

export function BodyGate({
  open,
  reason,
  requireFull = false,
  fullWidth = false,
  children,
}: {
  open: boolean;
  reason: string;
  requireFull?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}) {
  const { character, stats, activity, setActivity, rest } = useGame();
  if (!character || !stats || !open) return <>{children}</>;

  const blocked = requireFull
    ? character.health < stats.maxHealth
    : character.health <= stats.maxHealth * MIN_HEALTH_RATIO_TO_ACT;
  if (!blocked) return <>{children}</>;

  const recovery = (
    <RecoveryButton
      fullWidth={fullWidth}
      recovering={activity?.kind === "rest"}
      beat={String(character.health)}
      recoveringLabel="Recuperando-se..."
      label="Recuperar-se"
      tooltip={requireFull ? reason : "Vida baixa demais. " + reason}
      onClick={activity?.kind === "rest" ? () => setActivity(null) : rest}
    />
  );

  return fullWidth ? <div className="w-full">{recovery}</div> : recovery;
}
