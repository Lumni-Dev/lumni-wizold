"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { furyRemainingMs, isFullMoon } from "@/models/rules/moon";
import { Button } from "./button";

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
    <Button
      variant={furyActive ? "secondary" : "primary"}
      disabled={furyActive}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
