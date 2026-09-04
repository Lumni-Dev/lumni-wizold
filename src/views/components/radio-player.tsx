"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { radioStore } from "@/controllers/radio.store";
import { radioRepository } from "@/models/repositories/radio.repository";

const UNLOCK_EVENTS: Array<keyof DocumentEventMap> = [
  "pointerdown",
  "touchstart",
  "keydown",
  "wheel",
  "mousemove",
  "click",
];

export function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const enabled = useSyncExternalStore(
    radioRepository.subscribe,
    radioRepository.enabled,
    radioRepository.serverSnapshot,
  );
  const volume = useSyncExternalStore(
    radioRepository.subscribe,
    radioRepository.volume,
    radioRepository.serverVolumeSnapshot,
  );
  const { tracks, index } = useSyncExternalStore(
    radioStore.subscribe,
    radioStore.snapshot,
    radioStore.serverSnapshot,
  );

  useEffect(() => {
    radioStore.load();
  }, []);

  const track = enabled && tracks.length > 0 ? tracks[Math.min(index, tracks.length - 1)] : null;
  const trackUrl = track?.url ?? null;

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume, trackUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !trackUrl) return undefined;

    audio.volume = volume;
    audio.muted = false;

    let unlocked = false;

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

    const kick = () => {
      if (!unlocked) tryPlay();
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
  }, [trackUrl, volume]);

  if (!trackUrl) return null;

  return (
    <audio
      ref={audioRef}
      src={trackUrl}
      preload="none"
      aria-hidden="true"
      onEnded={() => radioStore.next()}
    />
  );
}
