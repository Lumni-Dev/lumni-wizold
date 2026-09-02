"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { artLoadedFromImg, isArtCached, markArtCached } from "@/shared/utils/art-cache";
import { cn } from "@/shared/utils/class-names";

export function ArtImage({
  source,
  fit = "cover",
  className,
}: {
  source: string;
  fit?: "cover" | "contain";
  className?: string;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(() => isArtCached(source));

  useLayoutEffect(() => {
    if (artLoadedFromImg(source, imgRef.current)) {
      setLoaded(true);
      return;
    }
    setLoaded(false);
  }, [source]);

  return (
    <span className={cn("relative block h-full w-full", className)}>
      {!loaded ? <span aria-hidden="true" className="art-shimmer absolute inset-0" /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={source}
        alt=""
        loading="lazy"
        onLoad={() => {
          markArtCached(source);
          setLoaded(true);
        }}
        className={cn(
          "h-full w-full transition-opacity duration-300",
          fit === "contain" ? "object-contain" : "object-cover",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </span>
  );
}
