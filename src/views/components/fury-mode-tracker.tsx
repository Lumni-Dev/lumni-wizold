"use client";

import { Flame } from "lucide-react";
import { useT } from "@/controllers/use-locale";
import { formatFuryClock } from "@/shared/utils/format";
import { Tooltip } from "./tooltip";
import { useFuryClock } from "./use-fury-clock";

export function FuryModeTracker({ iconOnly = false }: { iconOnly?: boolean }) {
  const { character, remaining, active } = useFuryClock();
  const t = useT();

  if (!character || !active) return null;

  if (iconOnly) {
    return (
      <Tooltip block label={t("Fury Mode") + ": " + formatFuryClock(remaining)}>
        <div className="flex h-8 items-center justify-center rounded-md transition-colors hover:bg-surface/70">
          <Flame aria-hidden strokeWidth={1.75} className="fury-glow-icon h-4 w-4" />
        </div>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-md px-2.5 py-2 transition-colors hover:bg-surface/70">
      <Flame aria-hidden strokeWidth={1.75} className="fury-glow-icon h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="fury-glow-text truncate text-[10px] uppercase tracking-[0.16em]">
          {t("Fury Mode")}
        </p>
        <p className="font-mono text-[11px] text-ember">{formatFuryClock(remaining)}</p>
      </div>
    </div>
  );
}
