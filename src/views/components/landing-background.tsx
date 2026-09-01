"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/utils/class-names";

const WALLPAPER = "/assets/ui/background.jpg?v=2";
const VIDEO = "/assets/ui/landing-background.mp4?v=2";
const PLAYBACK_RATE = 0.55;
const TURN_MARGIN_S = 0.5;

function supportsReversePlayback(video: HTMLVideoElement): boolean {
  try {
    video.playbackRate = -PLAYBACK_RATE;
    const ok = video.playbackRate < 0;
    video.playbackRate = PLAYBACK_RATE;
    return ok;
  } catch {
    return false;
  }
}

function startScrubPingPong(video: HTMLVideoElement) {
  video.pause();
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
  return () => cancelAnimationFrame(frame);
}

function startNativePingPong(video: HTMLVideoElement, onPlayFail: () => void) {
  video.loop = false;

  const playForward = () => {
    video.playbackRate = PLAYBACK_RATE;
    void video.play().catch(onPlayFail);
  };

  const playBackward = () => {
    video.playbackRate = -PLAYBACK_RATE;
    void video.play().catch(onPlayFail);
  };

  const onTimeUpdate = () => {
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;

    const endAt = Math.max(TURN_MARGIN_S, duration - TURN_MARGIN_S);
    const startAt = Math.min(TURN_MARGIN_S, endAt);

    if (video.playbackRate > 0 && video.currentTime >= endAt) {
      video.pause();
      video.currentTime = endAt;
      playBackward();
    } else if (video.playbackRate < 0 && video.currentTime <= startAt) {
      video.pause();
      video.currentTime = startAt;
      playForward();
    }
  };

  video.addEventListener("timeupdate", onTimeUpdate);
  video.currentTime = TURN_MARGIN_S;
  playForward();

  return () => {
    video.removeEventListener("timeupdate", onTimeUpdate);
    video.pause();
  };
}

export function LandingBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (failed || !ready) return;

    const video = videoRef.current;
    if (!video) return;

    let stop: () => void = () => undefined;
    const onPlayFail = () => {
      stop();
      stop = startScrubPingPong(video);
    };

    void video.play().catch(onPlayFail);

    stop = supportsReversePlayback(video)
      ? startNativePingPong(video, onPlayFail)
      : startScrubPingPong(video);

    return () => stop();
  }, [failed, ready]);

  const showVideo = !failed;

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
          showVideo && ready ? "opacity-0" : "opacity-100",
        )}
      />

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        onLoadedData={() => setReady(true)}
        onError={() => setFailed(true)}
        className={cn(
          "landing-backdrop-media absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-700",
          showVideo && ready ? "opacity-100" : "opacity-0",
        )}
      >
        <source src={VIDEO} type="video/mp4" />
      </video>

      <div className="landing-backdrop-shade absolute inset-0" />
    </div>
  );
}
