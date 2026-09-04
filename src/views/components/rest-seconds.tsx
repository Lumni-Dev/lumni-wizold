"use client";

import { useEffect, useState } from "react";
import { REST_TICK_MS } from "@/shared/constants/game";

const TICK_SECS = REST_TICK_MS / 1000;

function remainingFrom(origin: number): number {
  const elapsed = Math.max(0, Date.now() - origin);
  const left = TICK_SECS - (Math.floor(elapsed / 1000) % TICK_SECS);
  return left === 0 ? TICK_SECS : left;
}

export function RestSeconds() {
  const [origin] = useState(() => Date.now());
  const [seconds, setSeconds] = useState(() => remainingFrom(origin));

  useEffect(() => {
    const sync = () => setSeconds(remainingFrom(origin));
    sync();
    const timer = window.setInterval(sync, 250);
    return () => window.clearInterval(timer);
  }, [origin]);

  return <>{seconds}</>;
}
