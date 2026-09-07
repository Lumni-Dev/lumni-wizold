"use client";

import { useEffect, useRef, useState } from "react";

const GAIN_VISIBLE_MS = 4000;

export function useGained(total: number): number {
  const previous = useRef(total);
  const [gained, setGained] = useState(0);

  useEffect(() => {
    const from = previous.current;
    previous.current = total;
    if (total === from) return;
    setGained((current) => (total > from ? current + (total - from) : 0));
  }, [total]);

  useEffect(() => {
    if (gained <= 0) return;
    const timer = window.setTimeout(() => setGained(0), GAIN_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [gained]);

  return gained;
}
