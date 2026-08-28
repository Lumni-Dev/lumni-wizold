"use client";

import type { ReactNode } from "react";
import { useGame } from "@/controllers/game.context";
import { MIN_HEALTH_RATIO_TO_ACT, TRANSFORM_RAGE_COST } from "@/shared/constants/game";
import { Button } from "./button";
import { RecoveryButton } from "./recovery-button";
import { Tooltip } from "./tooltip";

export function BodyGate({
  open,
  reason,
  children,
}: {
  open: boolean;
  reason: string;
  children: ReactNode;
}) {
  const { character, stats, activity, setActivity, toggleForm, rest } = useGame();
  if (!character || !stats || !open || character.form === "werewolf") return <>{children}</>;

  const ready =
    character.rage >= TRANSFORM_RAGE_COST &&
    character.health > stats.maxHealth * MIN_HEALTH_RATIO_TO_ACT;

  if (ready) {
    return (
      <Tooltip label={reason + " Virar custa " + TRANSFORM_RAGE_COST + " de fúria."}>
        <Button variant="primary" onClick={toggleForm}>
          Transformar
        </Button>
      </Tooltip>
    );
  }

  return (
    <RecoveryButton
      recovering={activity?.kind === "rest"}
      beat={character.health + "-" + character.rage}
      recoveringLabel="Recuperando-se..."
      label="Recuperar-se"
      tooltip={"Falta corpo ou fúria para virar. " + reason}
      onClick={activity?.kind === "rest" ? () => setActivity(null) : rest}
    />
  );
}
