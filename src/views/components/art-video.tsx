"use client";

import { useState } from "react";
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

  if (failed) return <ArtImage source={poster} className={className} />;

  return (
    <video
      src={source}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      onError={() => setFailed(true)}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
