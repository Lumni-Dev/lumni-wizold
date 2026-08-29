"use client";

import { useArt } from "@/controllers/art.context";
import type { Item } from "@/models/entities/item";
import { itemInitials } from "../presenters/item.presenter";
import { IconArt, IconFrame, type IconSize } from "./icon-frame";

export function ItemIcon({ item, size = "medium" }: { item: Item; size?: IconSize }) {
  const art = useArt();
  const source = art.items[item.id];

  return (
    <IconFrame size={size} className={source ? undefined : "tracking-widest"}>
      {source ? <IconArt source={source} glow /> : itemInitials(item.name)}
    </IconFrame>
  );
}
