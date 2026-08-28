"use client";

import { useEffect, useState } from "react";
import { REST_TICK_MS } from "@/shared/constants/game";

export function RestSeconds() {
  const [seconds, setSeconds] = useState(REST_TICK_MS / 1000);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <>{seconds}</>;
}
