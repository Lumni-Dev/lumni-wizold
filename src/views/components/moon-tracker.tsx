"use client";

import { Moon } from "lucide-react";
import { useGame } from "@/controllers/game.context";
import { useT } from "@/controllers/use-locale";
import { FURY_ATTRIBUTE_BONUS } from "@/shared/constants/game";
import { cn } from "@/shared/utils/class-names";
import { Tooltip } from "./tooltip";

export function MoonTracker({
  flush = false,
  iconOnly = false,
}: {
  flush?: boolean;
  iconOnly?: boolean;
}) {
  const { moon } = useGame();
  const t = useT();

  const xpBonus = Math.round(moon.phase.experienceBonus * 100);
  const trainingBonus = Math.round(moon.phase.trainingBonus * 100);
  const miningBonus = Math.round(moon.phase.miningBonus * 100);
  const furyBonus = moon.phase.key === "full" ? FURY_ATTRIBUTE_BONUS : 0;
  const perks: string[] = [];
  if (xpBonus > 0) perks.push(t("+" + xpBonus + "% hunt experience"));
  if (trainingBonus > 0) perks.push(t("+" + trainingBonus + "% in training"));
  if (miningBonus > 0) perks.push(t("+" + miningBonus + "% in mining"));
  if (furyBonus > 0) perks.push(t("Fury Mode: +" + furyBonus + " to all attributes"));
  const bonusLine = perks.length > 0 ? perks.join(" · ") : t("No bonus this phase");

  if (iconOnly) {
    return (
      <Tooltip block label={t(moon.phase.label) + ": " + bonusLine}>
        <div className="flex h-8 items-center justify-center border-b border-edge">
          <Moon aria-hidden strokeWidth={1.75} className="h-4 w-4 text-ink-soft" />
        </div>
      </Tooltip>
    );
  }

  return (
    <Tooltip block label={t(moon.phase.description)}>
      <div
        className={cn(
          "relative flex items-stretch",
          flush ? "border-b border-edge" : "rounded-md border border-edge bg-surface/70",
        )}
      >
        <span className="flex w-8 shrink-0 items-center justify-center border-r border-edge">
          <Moon aria-hidden strokeWidth={1.75} className="h-4 w-4 text-ink-soft" />
        </span>
        <div className="min-w-0 flex-1 px-3 py-2">
          <p className="truncate text-[10px] uppercase tracking-[0.16em] text-ink">
            {t(moon.phase.label)}
          </p>
          <p className="text-[10px] text-ink-faint">{bonusLine}</p>
        </div>
      </div>
    </Tooltip>
  );
}
