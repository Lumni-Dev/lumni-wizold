"use client";

import { useArt } from "@/controllers/art.context";
import type { StorePack } from "@/models/data/store-packs";
import { formatBronze } from "@/shared/utils/format";
import { IconArt, IconFrame, type IconSize } from "./icon-frame";

export function PackIcon({
  pack,
  size = "medium",
  className,
}: {
  pack: StorePack;
  size?: IconSize;
  className?: string;
}) {
  const art = useArt();
  const source = art.packs[pack.id];

  return (
    <IconFrame size={size} tone={pack.highlight ? "strong" : "default"} className={className}>
      {source ? <IconArt source={source} /> : formatBronze(pack.bronze)}
    </IconFrame>
  );
}
