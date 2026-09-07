"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const UNLOCK_EVENTS: Array<keyof DocumentEventMap> = [
  "pointerdown",
  "touchstart",
  "keydown",
  "wheel",
];

export interface Narration {
  current: string | null;
  loading: string | null;
  play: (source: string) => void;
  stop: () => void;
  toggle: (source: string) => void;
}

export function useNarration(): Narration {
  const audio = useRef<HTMLAudioElement | null>(null);
  const unlock = useRef<(() => void) | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const unbind = useCallback(() => {
    if (!unlock.current) return;
    const kick = unlock.current;
    UNLOCK_EVENTS.forEach((name) => document.removeEventListener(name, kick));
    unlock.current = null;
  }, []);

  const stop = useCallback(() => {
    unbind();
    audio.current?.pause();
    audio.current = null;
    setCurrent(null);
    setLoading(null);
  }, [unbind]);

  const play = useCallback(
    (source: string) => {
      unbind();
      audio.current?.pause();
      setCurrent(null);
      setLoading(source);
      const element = new Audio(source);
      element.addEventListener("ended", () => {
        if (audio.current === element) {
          audio.current = null;
          setCurrent(null);
        }
      });
      element.addEventListener("error", () => {
        if (audio.current === element) {
          audio.current = null;
          setCurrent(null);
          setLoading(null);
        }
      });
      audio.current = element;

      const tryPlay = () => {
        void element.play().then(
          () => {
            unbind();
            setCurrent(source);
            setLoading(null);
          },
          () => undefined,
        );
      };

      const kick = () => {
        if (audio.current === element) tryPlay();
      };
      unlock.current = kick;
      UNLOCK_EVENTS.forEach((name) => document.addEventListener(name, kick, { passive: true }));
      tryPlay();
    },
    [unbind],
  );

  const toggle = useCallback(
    (source: string) => {
      if (audio.current && (current === source || loading === source)) {
        stop();
        return;
      }
      play(source);
    },
    [current, loading, play, stop],
  );

  useEffect(() => () => stop(), [stop]);

  return useMemo(
    () => ({ current, loading, play, stop, toggle }),
    [current, loading, play, stop, toggle],
  );
}

export function areaVoice(territoryId: string, locale: "pt" | "en" | "es" = "pt"): string {
  const suffix = locale === "pt" ? "" : "." + locale;
  return "/assets/voice/area-" + territoryId + suffix + ".mp3?v=1";
}
