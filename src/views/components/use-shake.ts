"use client";

import { useEffect, useState } from "react";

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
