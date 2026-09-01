"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { playClick } from "@/controllers/sound";
import { furyRemainingMs, isFullMoon } from "@/models/rules/moon";
import { cn } from "@/shared/utils/class-names";
import { FuryRingFrame } from "./fury-ring-frame";

function furyClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return Math.floor(total / 60) + ":" + String(total % 60).padStart(2, "0");
}

export function FuryUseButton({ onClick }: { onClick: () => void }) {
  const { character, moon } = useGame();
  const [now, setNow] = useState(() => Date.now());

  const fullMoon = isFullMoon(moon.phase.key);
  const remaining = character ? furyRemainingMs(character, moon.phase.key, now) : 0;
  const furyActive = remaining > 0;
  const potionActive =
    !!character?.furyUntil && Date.parse(character.furyUntil) > now;

  useEffect(() => {
    if (!furyActive) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [furyActive]);

  const label = fullMoon
    ? "Lua cheia"
    : potionActive
      ? "Em fúria " + furyClock(remaining)
      : "Beber";

  return (
    <FuryRingFrame
      as="button"
      type="button"
      contentAlign="center"
      disabled={furyActive}
      aria-disabled={furyActive}
      onClick={() => {
        if (furyActive) return;
        playClick();
        onClick();
      }}
      className={cn(
        "inline-block rounded-md border-0 bg-transparent p-0 font-[inherit]",
        furyActive && "cursor-default",
      )}
      fillClassName={cn(
        "h-8 px-3 text-[11px] font-medium uppercase tracking-[0.16em]",
        "transition-[filter] duration-150",
        furyActive
          ? "bg-surface-high text-ink"
          : "bg-ember text-base hover:brightness-110",
      )}
    >
      {label}
    </FuryRingFrame>
  );
}
