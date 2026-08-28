"use client";

import { useArt } from "@/controllers/art.context";
import type { Territory } from "@/models/entities/territory";
import { IconArt, IconFrame, type IconSize } from "./icon-frame";

export function TerritoryIcon({
  territory,
  size = "medium",
  className,
}: {
  territory: Territory;
  size?: IconSize;
  className?: string;
}) {
  const art = useArt();
  const source = art.territories[territory.id];

  return (
    <IconFrame size={size} className={className}>
      {source ? (
        <IconArt source={source} padded={false} />
      ) : (
        territory.name.slice(0, 2).toUpperCase()
      )}
    </IconFrame>
  );
}
