"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { backgroundRepository } from "@/models/repositories/background.repository";

const WALLPAPER = "/assets/ui/background.jpg?v=2";
const VIDEO = "/assets/ui/landing-background.mp4?v=9";

const UNLOCK_EVENTS: Array<keyof DocumentEventMap> = [
  "pointerdown",
  "touchstart",
  "keydown",
  "wheel",
  "mousemove",
];

export function LiveBackdrop({ shade = "soft" }: { shade?: "soft" | "deep" }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [failed, setFailed] = useState(false);
  const darkness = useSyncExternalStore(
    backgroundRepository.subscribe,
    backgroundRepository.darkness,
    backgroundRepository.serverDarknessSnapshot,
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let unlocked = false;

    const unbind = () => {
      UNLOCK_EVENTS.forEach((name) => document.removeEventListener(name, kick));
      document.removeEventListener("visibilitychange", wake);
    };

    const tryPlay = () => {
      video.muted = true;
      video.defaultMuted = true;
      video
        .play()
        .then(() => {
          if (!video.paused) {
            unlocked = true;
            UNLOCK_EVENTS.forEach((name) =>
              document.removeEventListener(name, kick),
            );
          }
        })
        .catch(() => undefined);
    };

    const kick = () => {
      if (!unlocked) tryPlay();
    };

    const wake = () => {
      if (document.visibilityState === "visible" && video.paused) tryPlay();
    };

    UNLOCK_EVENTS.forEach((name) =>
      document.addEventListener(name, kick, { passive: true }),
    );
    document.addEventListener("visibilitychange", wake);

    tryPlay();

    return () => {
      unbind();
      video.pause();
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={WALLPAPER}
        alt=""
        className="live-backdrop-media absolute inset-0 h-full w-full object-cover object-top"
      />
      {!failed ? (
        <video
          ref={videoRef}
          src={VIDEO}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={WALLPAPER}
          onError={() => setFailed(true)}
          className="live-backdrop-media absolute inset-0 h-full w-full object-cover object-top"
        />
      ) : null}

      <div
        className={
          (shade === "deep" ? "live-backdrop-shade-deep" : "live-backdrop-shade") +
          " absolute inset-0"
        }
        style={
          shade === "deep"
            ? ({ "--shade-scale": String(darkness) } as CSSProperties)
            : undefined
        }
      />
    </div>
  );
}
