"use client";

import { Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { furyRemainingMs } from "@/models/rules/moon";
import { formatFuryClock } from "@/shared/utils/format";
import { FuryRingFrame } from "./fury-ring-frame";

export function FuryModeTracker() {
  const { character, moon } = useGame();
  const [now, setNow] = useState(() => Date.now());

  const remaining = character ? furyRemainingMs(character, moon.phase.key, now) : 0;
  const active = remaining > 0;

  useEffect(() => {
    if (!active) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);

  if (!character || !active) return null;

  const clock = formatFuryClock(remaining);

  return (
    <FuryRingFrame className="block w-full" contentAlign="start" fillClassName="w-full">
      <div className="flex w-full items-stretch">
        <span className="flex w-8 shrink-0 items-center justify-center self-stretch border-r border-edge">
          <Flame aria-hidden strokeWidth={1.75} className="h-4 w-4 text-ember" />
        </span>
        <div className="min-w-0 flex-1 px-3 py-2">
          <p className="truncate text-[10px] uppercase tracking-[0.16em] text-ink">Modo Fúria</p>
          <p className="font-mono text-[11px] text-ember">{clock}</p>
        </div>
      </div>
    </FuryRingFrame>
  );
}
