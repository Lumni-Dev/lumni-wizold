"use client";

import { useState } from "react";
import { useArt } from "@/controllers/art.context";
import type { Creature } from "@/models/entities/creature";
import { IconArt, IconFrame, type IconSize, type FrameTone } from "./icon-frame";

function creatureInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const letters = words.map((word) => word[0] ?? "").join("");
  return (letters.slice(0, 2) || name.slice(0, 2)).toUpperCase();
}

export function CreatureIcon({
  creature,
  size = "medium",
  inset,
  tone,
  zoom,
}: {
  creature: Creature;
  size?: IconSize;
  inset?: string;
  tone?: FrameTone;
  zoom?: boolean;
}) {
  const art = useArt();
  const source = art.creatures[creature.id];
  const [broken, setBroken] = useState(false);

  return (
    <IconFrame size={size} tone={tone} className={source && !broken ? undefined : "tracking-widest"}>
      {source && !broken ? (
        <IconArt
          source={source}
          fit="contain"
          inset={inset}
          zoom={zoom}
          glow
          onFail={() => setBroken(true)}
        />
      ) : (
        creatureInitials(creature.name)
      )}
    </IconFrame>
  );
}

export function CreatureArtFill({ creature }: { creature: Creature }) {
  const art = useArt();
  const source = art.creatures[creature.id];
  const [broken, setBroken] = useState(false);

  if (!source || broken) {
    return (
      <span className="grid h-full w-full place-items-center font-mono text-sm tracking-widest text-ink-faint">
        {creatureInitials(creature.name)}
      </span>
    );
  }

  return (
    <span className="relative flex h-full w-full">
      <IconArt
        source={source}
        padded={false}
        fit="contain"
        glow
        onFail={() => setBroken(true)}
      />
    </span>
  );
}
