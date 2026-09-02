"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { musicRepository } from "@/models/repositories/music.repository";

const TRACK = "/assets/sounds/trilha.mp3?v=1";

const UNLOCK_EVENTS: Array<keyof DocumentEventMap> = [
  "pointerdown",
  "touchstart",
  "keydown",
  "wheel",
];

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

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    audio.volume = musicRepository.volume();

    let unlocked = false;

    const kick = () => {
      if (!unlocked) tryPlay();
    };

    const unbind = () => {
      UNLOCK_EVENTS.forEach((name) => document.removeEventListener(name, kick));
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

    UNLOCK_EVENTS.forEach((name) => document.addEventListener(name, kick, { passive: true }));
    tryPlay();

    return () => {
      unbind();
      audio.pause();
    };
  }, [enabled]);

  if (!enabled) return null;

  return <audio ref={audioRef} src={TRACK} loop preload="none" aria-hidden="true" />;
}
