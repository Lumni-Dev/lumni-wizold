"use client";

import { useGame } from "@/controllers/game.context";
import { REST_TICK_MS } from "@/shared/constants/game";
import { RecoveryButton } from "./recovery-button";

export function VitalActionButton({
  size = "medium",
  fullWidth = false,
}: {
  size?: "small" | "medium";
  fullWidth?: boolean;
}) {
  const { character, stats, activity, setActivity, rest } = useGame();
  if (!character || !stats) return null;

  const resting = activity?.kind === "rest";
  const whole = character.health >= stats.maxHealth;
  if (!resting && whole) return null;

  return (
    <RecoveryButton
      size={size}
      fullWidth={fullWidth}
      recovering={resting}
      beat={String(character.health)}
      recoveringLabel="Recuperando-se..."
      label="Recuperar-se"
      tooltip={
        resting
          ? "O corpo se recompõe a cada " +
            REST_TICK_MS / 1000 +
            " segundos. Clique para interromper."
          : "Recupera parte da vida a cada " + REST_TICK_MS / 1000 + " segundos."
      }
      onClick={resting ? () => setActivity(null) : rest}
    />
  );
}
