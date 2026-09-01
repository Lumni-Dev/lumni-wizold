"use client";

import { Moon } from "lucide-react";
import { useGame } from "@/controllers/game.context";
import { FURY_ATTRIBUTE_BONUS } from "@/shared/constants/game";
import { Tooltip } from "./tooltip";

export function MoonTracker() {
  const { moon } = useGame();

  const xpBonus = Math.round(moon.phase.experienceBonus * 100);
  const furyBonus = moon.phase.key === "full" ? FURY_ATTRIBUTE_BONUS : 0;
  const bonusLine =
    xpBonus > 0 && furyBonus > 0
      ? "+" + xpBonus + "% de experiência · Modo Fúria ativo"
      : xpBonus > 0
        ? "+" + xpBonus + "% de experiência na caça"
        : furyBonus > 0
          ? "Modo Fúria: +" + furyBonus + " em todos os atributos"
          : "Sem bônus nesta fase";

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
          <p className="text-[10px] text-ink-faint">{bonusLine}</p>
        </div>
      </div>
    </Tooltip>
  );
}
