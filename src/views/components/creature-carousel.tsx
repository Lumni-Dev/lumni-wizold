"use client";

import { useMemo, type CSSProperties } from "react";
import { useArt } from "@/controllers/art.context";
import { CREATURES } from "@/models/data/creatures";
import type { Creature } from "@/models/entities/creature";
import { CreatureIcon } from "./creature-icon";

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
    <div aria-hidden="true" className="drift-fade relative overflow-hidden">
      <div className="creature-drift flex w-max items-center gap-2" style={style}>
        {strip.map((creature, position) => (
          <CreatureIcon
            key={String(position) + "-" + creature.id}
            creature={creature}
            size="huge"
            inset="p-3"
          />
        ))}
      </div>
    </div>
  );
}
