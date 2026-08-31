"use client";

import { useArt } from "@/controllers/art.context";
import type { Creature } from "@/models/entities/creature";
import { IconArt, IconFrame, type IconSize } from "./icon-frame";

function creatureInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const letters = words.map((word) => word[0] ?? "").join("");
  return (letters.slice(0, 2) || name.slice(0, 2)).toUpperCase();
}

export function CreatureIcon({
  creature,
  size = "medium",
}: {
  creature: Creature;
  size?: IconSize;
}) {
  const art = useArt();
  const source = art.creatures[creature.id];

  return (
    <IconFrame size={size} className={source ? undefined : "tracking-widest"}>
      {source ? <IconArt source={source} fit="contain" glow /> : creatureInitials(creature.name)}
    </IconFrame>
  );
}
