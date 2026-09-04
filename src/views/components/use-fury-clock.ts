"use client";

import { useState, useSyncExternalStore } from "react";
import { useGame } from "@/controllers/game.context";
import { furyRemainingMs, isFullMoon, potionFuryRemainingMs } from "@/models/rules/moon";
import { serverNow } from "@/shared/utils/server-clock";

const CLOCK_TICK_MS = 250;

let clockNow = 0;
let clockTimer = 0;
const clockListeners = new Set<() => void>();

function subscribeClock(listener: () => void): () => void {
  clockListeners.add(listener);
  if (clockListeners.size === 1) {
    clockNow = serverNow();
    clockTimer = window.setInterval(() => {
      clockNow = serverNow();
      for (const entry of clockListeners) entry();
    }, CLOCK_TICK_MS);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0) {
      window.clearInterval(clockTimer);
      clockTimer = 0;
    }
  };
}

function readClock(): number {
  return clockNow;
}

function readServerClock(): number {
  return 0;
}

export function useFuryClock() {
  const { character, moon } = useGame();
  const furyUntil = character?.furyUntil ?? "";
  const phase = moon.phase.key;
  const [mountedAt] = useState(() => serverNow());
  const tickedAt = useSyncExternalStore(subscribeClock, readClock, readServerClock);
  const now = Math.max(mountedAt, tickedAt);

  const remaining = character ? furyRemainingMs(character, phase, now) : 0;
  const potionLeft = character ? potionFuryRemainingMs(character, now) : 0;
  const active = remaining > 0;
  const sky = isFullMoon(phase, now);

  return {
    character,
    moon,
    remaining,
    potionLeft,
    active,
    sky,
    furyUntil,
  };
}
