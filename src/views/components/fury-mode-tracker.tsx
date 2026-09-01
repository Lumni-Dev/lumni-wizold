"use client";

import { Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { SpinBorder } from "./spin-border";

function furyClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return Math.floor(total / 60) + ":" + String(total % 60).padStart(2, "0");
}

export function FuryModeTracker() {
  const { character } = useGame();
  const [now, setNow] = useState(() => Date.now());

  const remaining = character?.furyUntil
    ? Math.max(0, Date.parse(character.furyUntil) - now)
    : 0;
  const active = remaining > 0;

  useEffect(() => {
    if (!character?.furyUntil) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [character?.furyUntil]);

  if (!active || !character) return null;

  const clock = furyClock(remaining);

  return (
    <SpinBorder innerClassName="relative flex items-stretch bg-surface/70">
      <span className="flex w-8 shrink-0 items-center justify-center self-stretch border-r border-edge">
        <Flame aria-hidden strokeWidth={1.75} className="h-4 w-4 text-ember" />
      </span>
      <div className="min-w-0 flex-1 px-3 py-2">
        <p className="truncate text-[10px] uppercase tracking-[0.16em] text-ink">Modo Fúria</p>
        <p className="font-mono text-[11px] text-ember">{clock}</p>
      </div>
    </SpinBorder>
  );
}
