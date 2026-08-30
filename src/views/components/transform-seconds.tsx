"use client";

import { useEffect, useState } from "react";
import { TRANSFORM_DURATION_MS } from "@/shared/constants/game";

// The time left on the current transformation as M:SS, read from the stamp so it
// stays honest across renders and refreshes. Starts full (the common case is
// transforming just now) and corrects on the first tick; the provider brings the
// human back when it reaches zero.
export function TransformSeconds({ transformedAt }: { transformedAt: string }) {
  const deadline = Date.parse(transformedAt) + TRANSFORM_DURATION_MS;
  const [remaining, setRemaining] = useState(TRANSFORM_DURATION_MS);

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, deadline - Date.now()));
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [deadline]);

  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return <>{minutes + ":" + String(seconds).padStart(2, "0")}</>;
}
