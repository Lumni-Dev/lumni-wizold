"use client";

import { useArt } from "@/controllers/art.context";
import type { StorePack } from "@/models/data/store-packs";
import { formatBronze } from "@/shared/utils/format";
import { ArtImage } from "./art-image";
import { IconArt, IconFrame, type IconSize } from "./icon-frame";

export function usePackArt(pack: StorePack) {
  return useArt().packs[pack.id];
}

export function PackIcon({
  pack,
  size = "medium",
  className,
}: {
  pack: StorePack;
  size?: IconSize;
  className?: string;
}) {
  const source = usePackArt(pack);

  return (
    <IconFrame size={size} tone={pack.highlight ? "strong" : "default"} className={className}>
      {source ? (
        <IconArt source={source} padded={false} fit="contain" glow />
      ) : (
        formatBronze(pack.bronze)
      )}
    </IconFrame>
  );
}

// The offer wears the same banner every other card in the game wears: art at
// the top, edge to edge, fitted whole over its own air, with the identity
// strip below it. The pouches used to sit in a `huge` icon frame beside the
// title, which is the one shape no other card in the game uses.
export function PackBanner({ pack }: { pack: StorePack }) {
  const source = usePackArt(pack);

  if (!source) return null;

  return (
    <div className="relative aspect-[3/2] w-full overflow-hidden border-b border-edge">
      <ArtImage source={source} fit="contain" className="p-4" />
    </div>
  );
}
