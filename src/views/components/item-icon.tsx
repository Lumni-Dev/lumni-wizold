"use client";

import { useArt } from "@/controllers/art.context";
import type { Item } from "@/models/entities/item";
import { itemInitials } from "../presenters/item.presenter";
import { IconArt, IconFrame, type IconSize } from "./icon-frame";

export function ItemIcon({
  item,
  size = "medium",
  shine,
}: {
  item: Item;
  size?: IconSize;
  shine?: boolean;
}) {
  const art = useArt();
  const source = art.items[item.id];

  return (
    <IconFrame size={size} shine={shine} className={source ? undefined : "tracking-widest"}>
      {source ? <IconArt source={source} /> : itemInitials(item.name)}
    </IconFrame>
  );
}
