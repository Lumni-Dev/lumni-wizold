"use client";

import { useEffect, useRef, useState } from "react";

const WALLPAPER = "/assets/ui/background.jpg?v=2";
const VIDEO = "/assets/ui/landing-background.mp4?v=9";

const UNLOCK_EVENTS: Array<keyof DocumentEventMap> = [
  "pointerdown",
  "touchstart",
  "keydown",
  "wheel",
  "mousemove",
];

export function LandingBackground() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [failed, setFailed] = useState(false);

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
      {failed ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={WALLPAPER}
          alt=""
          className="landing-backdrop-media absolute inset-0 h-full w-full object-cover object-top"
        />
      ) : (
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
          className="landing-backdrop-media absolute inset-0 h-full w-full object-cover object-top"
        />
      )}

      <div className="landing-backdrop-shade absolute inset-0" />
    </div>
  );
}
