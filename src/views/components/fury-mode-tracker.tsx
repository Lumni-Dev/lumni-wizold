"use client";

import { Flame } from "lucide-react";
import { formatFuryClock } from "@/shared/utils/format";
import { FuryRingFrame } from "./fury-ring-frame";
import { useFuryClock } from "./use-fury-clock";

export function FuryModeTracker() {
  const { character, remaining, active, furyUntil } = useFuryClock();

  if (!character || !active) return null;

  return (
    <FuryRingFrame
      className="block w-full"
      contentAlign="start"
      fillClassName="w-full"
      animationKey={furyUntil || "sky"}
    >
      <div className="flex w-full items-stretch">
        <span className="flex w-8 shrink-0 items-center justify-center self-stretch border-r border-edge">
          <Flame aria-hidden strokeWidth={1.75} className="h-4 w-4 text-ember" />
        </span>
        <div className="min-w-0 flex-1 px-3 py-2">
          <p className="truncate text-[10px] uppercase tracking-[0.16em] text-ink">Modo Fúria</p>
          <p className="font-mono text-[11px] text-ember">{formatFuryClock(remaining)}</p>
        </div>
      </div>
    </FuryRingFrame>
  );
}
