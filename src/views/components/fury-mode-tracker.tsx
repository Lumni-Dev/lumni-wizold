"use client";

import { Flame } from "lucide-react";
import { useT } from "@/controllers/use-locale";
import { formatFuryClock } from "@/shared/utils/format";
import { useFuryClock } from "./use-fury-clock";

export function FuryModeTracker() {
  const { character, remaining, active } = useFuryClock();
  const t = useT();

  if (!character || !active) return null;

  return (
    <div className="flex items-stretch border-b border-edge">
      <span className="flex w-8 shrink-0 items-center justify-center border-r border-edge">
        <Flame aria-hidden strokeWidth={1.75} className="fury-glow-icon h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1 px-3 py-2">
        <p className="fury-glow-text truncate text-[10px] uppercase tracking-[0.16em]">
          {t("Fury Mode")}
        </p>
        <p className="font-mono text-[11px] text-ember">{formatFuryClock(remaining)}</p>
      </div>
    </div>
  );
}
