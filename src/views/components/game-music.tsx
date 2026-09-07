"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { musicRepository, type MusicTrackChoice } from "@/models/repositories/music.repository";
import { radioStore } from "@/controllers/radio.store";

type TrackKey = Exclude<MusicTrackChoice, "random">;

const TRACKS: Record<TrackKey, string> = {
  "1": "/assets/sounds/trilha.mp3?v=2",
  "2": "/assets/sounds/trilha2.mp3?v=1",
  "3": "/assets/sounds/trilha3.mp3?v=1",
};
const TRACK_KEYS: readonly TrackKey[] = ["1", "2", "3"];
const LANDING_VOLUME = 0.5;

function anotherTrack(current: TrackKey): TrackKey {
  const others = TRACK_KEYS.filter((key) => key !== current);
  return others[Math.floor(Math.random() * others.length)];
}

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
  { enabled, volume, src }: { enabled: boolean; volume: number; src: string },
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
  }, [audioRef, enabled, volume, src]);
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
  const radioPlaying = useSyncExternalStore(
    radioStore.subscribe,
    radioStore.isPlaying,
    () => false,
  );
  const choice = useSyncExternalStore(
    musicRepository.subscribe,
    musicRepository.track,
    musicRepository.serverTrackSnapshot,
  );
  const [randomKey, setRandomKey] = useState<TrackKey>("1");
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setRandomKey(TRACK_KEYS[Math.floor(Math.random() * TRACK_KEYS.length)]);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  const playing = enabled && !radioPlaying;
  const random = choice === "random";
  const src = TRACKS[random ? randomKey : choice];

  useMusicPlayback(audioRef, { enabled: playing, volume, src });

  if (!playing) return null;

  return (
    <audio
      ref={audioRef}
      src={src}
      loop={!random}
      preload="none"
      aria-hidden="true"
      onEnded={random ? () => setRandomKey(anotherTrack) : undefined}
    />
  );
}

export function LandingMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const enabled = useSyncExternalStore(
    musicRepository.subscribe,
    musicRepository.enabled,
    musicRepository.serverSnapshot,
  );

  useMusicPlayback(audioRef, { enabled, volume: LANDING_VOLUME, src: TRACKS["1"] });

  if (!enabled) return null;

  return <audio ref={audioRef} src={TRACKS["1"]} loop preload="auto" aria-hidden="true" />;
}
