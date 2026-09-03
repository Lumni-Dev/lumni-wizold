"use client";

import { useArt } from "@/controllers/art.context";
import type { Territory } from "@/models/entities/territory";
import { IconArt } from "./icon-frame";

function territoryInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const letters = words.map((word) => word[0] ?? "").join("");
  return (letters.slice(0, 2) || name.slice(0, 2)).toUpperCase();
}

export function TerritoryArtFill({ territory }: { territory: Territory }) {
  const art = useArt();
  const source = art.territories[territory.id];

  if (!source) {
    return (
      <span className="grid h-full w-full place-items-center font-mono text-sm tracking-widest text-ink-faint">
        {territoryInitials(territory.name)}
      </span>
    );
  }

  return (
    <span className="relative flex h-full w-full">
      <IconArt source={source} padded={false} />
    </span>
  );
}
