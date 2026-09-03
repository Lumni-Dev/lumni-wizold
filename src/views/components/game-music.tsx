"use client";

import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import { musicRepository } from "@/models/repositories/music.repository";

const TRACK = "/assets/sounds/trilha.mp3?v=1";

const UNLOCK_EVENTS: Array<keyof DocumentEventMap> = [
  "pointerdown",
  "touchstart",
  "keydown",
  "wheel",
  "mousemove",
  "click",
];

function useMusicPlayback(
  audioRef: RefObject<HTMLAudioElement | null>,
  { enabled, volume }: { enabled: boolean; volume: number },
) {
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [audioRef, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !enabled) return undefined;

    audio.volume = volume;
    audio.muted = false;

    let unlocked = false;

    const kick = () => {
      if (!unlocked) tryPlay();
    };

    const unbind = () => {
      UNLOCK_EVENTS.forEach((name) => document.removeEventListener(name, kick));
      window.removeEventListener("scroll", kick, true);
      document.removeEventListener("visibilitychange", wake);
    };

    const tryPlay = () => {
      audio
        .play()
        .then(() => {
          unlocked = true;
          unbind();
        })
        .catch(() => undefined);
    };

    const wake = () => {
      if (document.visibilityState === "visible" && audio.paused) tryPlay();
    };

    UNLOCK_EVENTS.forEach((name) => document.addEventListener(name, kick, { passive: true }));
    window.addEventListener("scroll", kick, { passive: true, capture: true });
    document.addEventListener("visibilitychange", wake);

    tryPlay();

    return () => {
      unbind();
      audio.pause();
    };
  }, [audioRef, enabled, volume]);
}

export function GameMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const enabled = useSyncExternalStore(
    musicRepository.subscribe,
    musicRepository.enabled,
    musicRepository.serverSnapshot,
  );
  const volume = useSyncExternalStore(
    musicRepository.subscribe,
    musicRepository.volume,
    musicRepository.serverVolumeSnapshot,
  );

  useMusicPlayback(audioRef, { enabled, volume });

  if (!enabled) return null;

  return <audio ref={audioRef} src={TRACK} loop preload="none" aria-hidden="true" />;
}

export function LandingMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const enabled = useSyncExternalStore(
    musicRepository.subscribe,
    musicRepository.enabled,
    musicRepository.serverSnapshot,
  );

  useMusicPlayback(audioRef, { enabled, volume: 1 });

  if (!enabled) return null;

  return <audio ref={audioRef} src={TRACK} loop preload="auto" aria-hidden="true" />;
}
