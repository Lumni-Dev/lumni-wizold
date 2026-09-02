"use client";

import { useEffect, useRef, useState } from "react";

export interface Narration {
  current: string | null;
  toggle: (source: string) => void;
}

export function useNarration(): Narration {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      audio.current?.pause();
      audio.current = null;
    };
  }, []);

  function toggle(source: string) {
    if (audio.current && current === source) {
      audio.current.pause();
      setCurrent(null);
      return;
    }

    audio.current?.pause();
    const element = new Audio(source);
    element.addEventListener("ended", () => setCurrent(null));
    audio.current = element;
    void element.play().catch(() => setCurrent(null));
    setCurrent(source);
  }

  return { current, toggle };
}

export function areaVoice(territoryId: string): string {
  return "/assets/voice/area-" + territoryId + ".mp3?v=1";
}
