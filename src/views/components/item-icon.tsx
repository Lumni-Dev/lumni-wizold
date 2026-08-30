"use client";

import { useArt } from "@/controllers/art.context";
import type { Item } from "@/models/entities/item";
import { itemInitials } from "../presenters/item.presenter";
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
  // The hand-drawn manifest wins (equipment art); otherwise the item's own image
  // path (the creatures' loot fills this), so a drawing is a .png dropped in the
  // folder, broken square until then, and initials only when neither is set.
  const source = art.items[item.id] ?? item.image;

  return (
    <IconFrame size={size} className={source ? undefined : "tracking-widest"}>
      {source ? (
        <IconArt source={source} glow badge={enhancement > 0 ? "+" + enhancement : undefined} />
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
