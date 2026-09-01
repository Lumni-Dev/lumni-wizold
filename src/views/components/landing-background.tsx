"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/utils/class-names";

const WALLPAPER = "/assets/ui/background.jpg?v=2";
const VIDEO = "/assets/ui/landing-background.mp4?v=4";
const PLAYBACK_RATE = 0.55;
const TURN_MARGIN_S = 0.5;

const UNLOCK_EVENTS = ["pointerdown", "mousemove", "wheel", "touchstart", "keydown"] as const;

function startPingPong(video: HTMLVideoElement) {
  video.loop = false;
  video.currentTime = TURN_MARGIN_S;

  let direction = 1;
  let last = performance.now();
  let frame = 0;

  const step = (now: number) => {
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      last = now;
      frame = requestAnimationFrame(step);
      return;
    }

    if (video.paused) {
      void video.play().catch(() => undefined);
    }

    const delta = Math.min((now - last) / 1000, 0.1);
    last = now;

    const endAt = Math.max(TURN_MARGIN_S, duration - TURN_MARGIN_S);
    const startAt = Math.min(TURN_MARGIN_S, endAt);

    let next = video.currentTime + direction * PLAYBACK_RATE * delta;

    if (next >= endAt) {
      next = endAt;
      direction = -1;
    } else if (next <= startAt) {
      next = startAt;
      direction = 1;
    }

    video.currentTime = next;
    frame = requestAnimationFrame(step);
  };

  frame = requestAnimationFrame(step);

  return () => {
    cancelAnimationFrame(frame);
    video.pause();
  };
}

export function LandingBackground() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;

    void video.play().catch(() => undefined);

    const stopPingPong = startPingPong(video);

    let unlocked = false;

    const tryPlay = () =>
      video.play().then(
        () => true,
        () => false,
      );

    const unbind = () => {
      for (const event of UNLOCK_EVENTS) {
        window.removeEventListener(event, unlock);
      }
    };

    const unlock = () => {
      if (unlocked) return;
      void tryPlay().then((ok) => {
        if (!ok) return;
        unlocked = true;
        unbind();
      });
    };

    void tryPlay().then((ok) => {
      if (ok) {
        unlocked = true;
        return;
      }
      for (const event of UNLOCK_EVENTS) {
        window.addEventListener(event, unlock, { passive: true });
      }
    });

    return () => {
      stopPingPong();
      unbind();
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-base"
    >
      {failed ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={WALLPAPER}
          alt=""
          className="landing-backdrop-media absolute inset-0 z-0 h-full w-full object-cover object-top"
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          preload="auto"
          poster={WALLPAPER}
          onError={() => setFailed(true)}
          className="landing-backdrop-media absolute inset-0 z-0 h-full w-full object-cover object-top"
        >
          <source src={VIDEO} type="video/mp4" />
        </video>
      )}

      <div className={cn("landing-backdrop-shade absolute inset-0 z-[1]")} />
    </div>
  );
}
