"use client";

import { useState } from "react";
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
  const source = art.creatures[creature.id] ?? creature.image;
  const [broken, setBroken] = useState(false);

  return (
    <IconFrame size={size} className={source && !broken ? undefined : "tracking-widest"}>
      {source && !broken ? (
        <IconArt source={source} fit="contain" glow onFail={() => setBroken(true)} />
      ) : (
        creatureInitials(creature.name)
      )}
    </IconFrame>
  );
}
