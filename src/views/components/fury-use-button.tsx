"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { furyRemainingMs } from "@/models/rules/moon";
import { Button } from "./button";
import { FuryRingFrame } from "./fury-ring-frame";

function furyClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return Math.floor(total / 60) + ":" + String(total % 60).padStart(2, "0");
}

export function FuryUseButton({ onClick }: { onClick: () => void }) {
  const { character, moon } = useGame();
  const [now, setNow] = useState(() => Date.now());

  const remaining = character ? furyRemainingMs(character, moon.phase.key, now) : 0;
  const furyActive = remaining > 0;

  useEffect(() => {
    if (!furyActive) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [furyActive]);

  if (!furyActive) {
    return (
      <Button variant="primary" onClick={onClick}>
        Beber
      </Button>
    );
  }

  return (
    <FuryRingFrame
      as="button"
      type="button"
      contentAlign="center"
      disabled
      aria-disabled
      className="inline-block cursor-default border-0 bg-transparent p-0 font-[inherit]"
      fillClassName="h-8"
    >
      <span className="px-3 font-mono text-[11px] text-ink">{furyClock(remaining)}</span>
    </FuryRingFrame>
  );
}
