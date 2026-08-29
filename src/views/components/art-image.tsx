"use client";

import { useState } from "react";
import { cn } from "@/shared/utils/class-names";

export function ArtImage({ source, className }: { source: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <span className={cn("relative block h-full w-full", className)}>
      {!loaded ? <span aria-hidden="true" className="art-shimmer absolute inset-0" /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={source}
        alt=""
        loading="lazy"
        ref={(img) => {
          if (img && img.complete && img.naturalWidth > 0) setLoaded(true);
        }}
        onLoad={() => setLoaded(true)}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </span>
  );
}
