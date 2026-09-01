"use client";

import { Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { furyRemainingMs } from "@/models/rules/moon";
import { FuryRingFrame } from "./fury-ring-frame";

function furyClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (days > 0) return days + "d " + hours + "h";
  if (hours > 0) return hours + "h " + minutes + "m";
  return Math.floor(total / 60) + ":" + String(seconds).padStart(2, "0");
}

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

  if (!active || !character) return null;

  const clock = furyClock(remaining);

  return (
    <FuryRingFrame className="block w-full" contentAlign="start">
      <div className="flex w-full items-stretch overflow-hidden">
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
