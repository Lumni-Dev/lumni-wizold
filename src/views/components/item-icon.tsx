"use client";

import { useArt } from "@/controllers/art.context";
import type { Item } from "@/models/entities/item";
import { itemInitials } from "../presenters/item.presenter";
import { ArtImage } from "./art-image";
import { IconArt, IconFrame, type IconSize } from "./icon-frame";

export function ItemIcon({
  item,
  size = "medium",
  enhancement = 0,
}: {
  item: Item;
  size?: IconSize;
  enhancement?: number;
}) {
  const art = useArt();
  const source = art.items[item.id];

  return (
    <IconFrame size={size} className={source ? undefined : "tracking-widest"}>
      {source ? (
        <IconArt
          source={source}
          fit="contain"
          glow
          badge={enhancement > 0 ? "+" + enhancement : undefined}
        />
      ) : (
        itemInitials(item.name)
      )}
      {enhancement > 0 ? (
        <span className="absolute right-1 top-1 inline-flex h-4 items-center justify-center rounded border border-ember bg-ember px-1 font-mono text-[10px] font-bold tracking-normal text-base">
          +{enhancement}
        </span>
      ) : null}
    </IconFrame>
  );
}

export function useItemArt(item: Item) {
  return useArt().items[item.id];
}

export function ItemBanner({ item, enhancement = 0 }: { item: Item; enhancement?: number }) {
  const source = useItemArt(item);

  if (!source) return null;

  return (
    <div className="relative aspect-[3/2] w-full overflow-hidden border-b border-edge">
      <ArtImage source={source} fit="contain" className="p-4" />
      {enhancement > 0 ? (
        <span className="absolute right-3 top-3 inline-flex h-5 items-center justify-center rounded border border-ember bg-ember px-1.5 font-mono text-[11px] font-bold tracking-normal text-base">
          +{enhancement}
        </span>
      ) : null}
    </div>
  );
}

export function ItemArtFill({ item }: { item: Item }) {
  const source = useItemArt(item);

  if (!source) {
    return (
      <span className="grid h-full w-full place-items-center font-mono text-sm tracking-widest text-ink-faint">
        {itemInitials(item.name)}
      </span>
    );
  }

  return (
    <span className="relative flex h-full w-full">
      <IconArt source={source} padded={false} fit="contain" />
    </span>
  );
}
