"use client";

import { useArt } from "@/controllers/art.context";
import type { Territory } from "@/models/entities/territory";
import { IconArt, IconFrame, type IconSize } from "./icon-frame";

export function TerritoryIcon({
  territory,
  size = "medium",
  shine,
  className,
}: {
  territory: Territory;
  size?: IconSize;
  shine?: boolean;
  className?: string;
}) {
  const art = useArt();
  const source = art.territories[territory.id];

  return (
    <IconFrame size={size} shine={shine} className={className}>
      {source ? (
        <IconArt source={source} padded={false} />
      ) : (
        territory.name.slice(0, 2).toUpperCase()
      )}
    </IconFrame>
  );
}
