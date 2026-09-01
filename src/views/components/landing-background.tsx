"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/utils/class-names";

const WALLPAPER = "/assets/ui/background.jpg?v=2";
const VIDEO = "/assets/ui/landing-background.mp4?v=3";
const PLAYBACK_RATE = 0.55;
const TURN_MARGIN_S = 0.5;

function startPingPong(video: HTMLVideoElement) {
  video.loop = false;
  video.muted = true;
  video.defaultMuted = true;
  video.currentTime = TURN_MARGIN_S;

  let direction = 1;
  let last = performance.now();
  let frame = 0;

  const ensurePlaying = () => {
    if (!video.paused) return;
    void video.play().catch(() => undefined);
  };

  const step = (now: number) => {
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      last = now;
      frame = requestAnimationFrame(step);
      return;
    }

    ensurePlaying();

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

  ensurePlaying();
  frame = requestAnimationFrame(step);

  return () => {
    cancelAnimationFrame(frame);
    video.pause();
  };
}

export function LandingBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (failed) return;

    const video = videoRef.current;
    if (!video) return;

    const sync = () => {
      if (video.readyState >= 1 && Number.isFinite(video.duration) && video.duration > 0) {
        setActive(true);
      }
    };

    sync();
    video.addEventListener("loadedmetadata", sync);
    video.addEventListener("loadeddata", sync);
    video.addEventListener("canplay", sync);

    return () => {
      video.removeEventListener("loadedmetadata", sync);
      video.removeEventListener("loadeddata", sync);
      video.removeEventListener("canplay", sync);
    };
  }, [failed]);

  useEffect(() => {
    if (failed || !active) return;

    const video = videoRef.current;
    if (!video) return;

    return startPingPong(video);
  }, [failed, active]);

  useEffect(() => {
    if (failed || !active) return;

    const video = videoRef.current;
    if (!video) return;

    let unlocked = !video.paused;

    const unlock = () => {
      if (unlocked) return;
      video.muted = true;
      video.defaultMuted = true;
      void video.play().then(() => {
        if (!video.paused) {
          unlocked = true;
          unbind();
        }
      });
    };

    const events = ["pointerdown", "mousemove", "wheel", "touchstart", "keydown"] as const;

    const unbind = () => {
      for (const event of events) {
        window.removeEventListener(event, unlock);
      }
    };

    unlock();

    if (!unlocked) {
      for (const event of events) {
        window.addEventListener(event, unlock, { passive: true });
      }
    }

    return unbind;
  }, [failed, active]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-base"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={WALLPAPER}
        alt=""
        className={cn(
          "landing-backdrop-media absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-700",
          active && !failed ? "opacity-0" : "opacity-100",
        )}
      />

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        poster={WALLPAPER}
        onError={() => setFailed(true)}
        className={cn(
          "landing-backdrop-media absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-700",
          active && !failed ? "opacity-100" : "opacity-0",
        )}
      >
        <source src={VIDEO} type="video/mp4" />
      </video>

      <div className="landing-backdrop-shade absolute inset-0" />
    </div>
  );
}
