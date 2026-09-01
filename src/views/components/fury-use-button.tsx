"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { Button } from "./button";

function furyClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return Math.floor(total / 60) + ":" + String(total % 60).padStart(2, "0");
}

export function FuryUseButton({ onClick }: { onClick: () => void }) {
  const { character } = useGame();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!character?.furyUntil) return undefined;
    const remaining = Date.parse(character.furyUntil) - Date.now();
    if (remaining <= 0) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [character?.furyUntil]);

  const furyRemaining = character?.furyUntil ? Date.parse(character.furyUntil) - now : 0;
  const furyActive = furyRemaining > 0;

  return (
    <Button
      variant={furyActive ? "secondary" : "primary"}
      disabled={furyActive}
      onClick={onClick}
    >
      {furyActive ? "Em fúria " + furyClock(furyRemaining) : "Usar"}
    </Button>
  );
}
