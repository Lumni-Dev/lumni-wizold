"use client";

import { useGame } from "@/controllers/game.context";
import { useVisibleActivity } from "@/controllers/use-visible-activity";
import { REST_TICK_MS } from "@/shared/constants/game";
import { RecoveryButton } from "./recovery-button";

export function VitalActionButton({
  size = "medium",
  fullWidth = false,
}: {
  size?: "small" | "medium";
  fullWidth?: boolean;
}) {
  const { character, stats, setActivity, rest } = useGame();
  const { activity } = useVisibleActivity();
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
      recoveringLabel="Recovering..."
      label="Recover"
      tooltip={
        resting
          ? "The body mends itself every " +
            REST_TICK_MS / 1000 +
            " seconds. Click to interrupt."
          : "Restores part of the health every " + REST_TICK_MS / 1000 + " seconds."
      }
      onClick={resting ? () => setActivity(null) : rest}
    />
  );
}
