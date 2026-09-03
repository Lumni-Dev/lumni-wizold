"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/utils/class-names";
import { ArtImage } from "./art-image";

export function ArtVideo({
  source,
  poster,
  className,
}: {
  source: string;
  poster: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let onScreen = false;

    const sync = () => {
      if (onScreen && document.visibilityState === "visible") {
        video.muted = true;
        void video.play().catch(() => undefined);
        return;
      }
      video.pause();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry?.isIntersecting ?? false;
        sync();
      },
      { threshold: 0.15 },
    );

    observer.observe(video);
    document.addEventListener("visibilitychange", sync);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      video.pause();
    };
  }, [source]);

  if (failed) return <ArtImage source={poster} className={className} />;

  return (
    <video
      ref={videoRef}
      src={source}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      onError={() => setFailed(true)}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
