"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { ElectricBorder } from "./electric-border";

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
    <div className="fury-electric-shell">
      <ElectricBorder borderRadius={12} speed={1} chaos={0.12}>
        <div className="fury-electric-content">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink">Modo Fúria</p>
          <p className="font-mono text-[11px] text-ember">{clock}</p>
        </div>
      </ElectricBorder>
    </div>
  );
}
