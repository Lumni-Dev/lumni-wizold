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
  play: (source: string) => void;
  stop: () => void;
  toggle: (source: string) => void;
}

export function useNarration(): Narration {
  const audio = useRef<HTMLAudioElement | null>(null);
  const unlock = useRef<(() => void) | null>(null);
  const [current, setCurrent] = useState<string | null>(null);

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
  }, [unbind]);

  const play = useCallback(
    (source: string) => {
      unbind();
      audio.current?.pause();
      const element = new Audio(source);
      element.addEventListener("ended", () => {
        if (audio.current === element) {
          audio.current = null;
          setCurrent(null);
        }
      });
      audio.current = element;

      const tryPlay = () => {
        void element.play().then(
          () => {
            unbind();
            setCurrent(source);
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
      if (audio.current && current === source) {
        stop();
        return;
      }
      play(source);
    },
    [current, play, stop],
  );

  useEffect(() => () => stop(), [stop]);

  return useMemo(() => ({ current, play, stop, toggle }), [current, play, stop, toggle]);
}

export function areaVoice(territoryId: string): string {
  return "/assets/voice/area-" + territoryId + ".mp3?v=1";
}
