"use client";

import { useEffect, useState } from "react";

// Returns true for a short beat each time `trigger` increments, to drive the
// `card-shake` animation on a critical blow. The trigger is a counter the caller
// bumps on every critical, given or received.
export function useShake(trigger: number, ms = 450): boolean {
  const [shaking, setShaking] = useState(false);
  useEffect(() => {
    if (!trigger) return;
    const timers = [
      window.setTimeout(() => setShaking(true), 0),
      window.setTimeout(() => setShaking(false), ms),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [trigger, ms]);
  return shaking;
}
