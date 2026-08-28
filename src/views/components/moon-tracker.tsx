"use client";

import { Moon } from "lucide-react";
import { useGame } from "@/controllers/game.context";
import { FULL_MOON_ATTRIBUTE_BONUS } from "@/models/rules/moon";
import { Tooltip } from "./tooltip";

export function MoonTracker() {
  const { moon } = useGame();

  const bonus = Math.round(moon.phase.experienceBonus * 100);
  const attributes = moon.phase.key === "full" ? FULL_MOON_ATTRIBUTE_BONUS : 0;

  return (
    <Tooltip block label={moon.phase.description}>
      <div className="relative flex items-stretch rounded-md border border-edge bg-surface/70">
        <span className="flex w-8 shrink-0 items-center justify-center border-r border-edge">
          <Moon aria-hidden strokeWidth={1.75} className="h-4 w-4 text-ink-soft" />
        </span>
        <div className="min-w-0 flex-1 px-3 py-2">
          <p className="truncate text-[10px] uppercase tracking-[0.16em] text-ink">
            {moon.phase.label}
          </p>
          <p className="text-[10px] text-ink-faint">
            {bonus > 0 ? "+" + bonus + "% de experiência" : "sem bônus"}
            {attributes > 0 ? " · +" + attributes + " em todos os atributos" : ""}
          </p>
        </div>
      </div>
    </Tooltip>
  );
}
