"use client";

import { useMemo, type CSSProperties } from "react";
import { useArt } from "@/controllers/art.context";
import { CREATURES } from "@/models/data/creatures";
import type { Creature } from "@/models/entities/creature";
import { ArtImage } from "./art-image";

const SECONDS_PER_CREATURE = 1.6;

export function CreatureCarousel() {
  const art = useArt();

  const roster = useMemo<readonly Creature[]>(
    () =>
      [...CREATURES]
        .sort((left, right) => left.level - right.level)
        .filter((creature) => Boolean(art.creatures[creature.id])),
    [art],
  );

  if (roster.length === 0) return null;

  const strip = [...roster, ...roster];
  const style = {
    "--drift-seconds": String(roster.length * SECONDS_PER_CREATURE) + "s",
  } as CSSProperties;

  return (
    <div aria-hidden="true" className="relative overflow-hidden">
      <div className="creature-drift flex w-max gap-6" style={style}>
        {strip.map((creature, position) => (
          <div key={String(position) + "-" + creature.id} className="h-24 w-24 shrink-0">
            <ArtImage source={art.creatures[creature.id]} fit="contain" className="opacity-80" />
          </div>
        ))}
      </div>
    </div>
  );
}
