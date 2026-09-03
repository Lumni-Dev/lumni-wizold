"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { useArt } from "@/controllers/art.context";
import { CREATURES } from "@/models/data/creatures";
import type { Creature } from "@/models/entities/creature";
import { CreatureIcon } from "./creature-icon";

const SECONDS_PER_CREATURE = 1.6;
const RESTING_OPACITY = 0.55;
const REACH_IN_ITEMS = 2.5;

export function CreatureCarousel() {
  const art = useArt();
  const boxRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const roster = useMemo<readonly Creature[]>(
    () =>
      [...CREATURES]
        .sort((left, right) => left.level - right.level)
        .filter((creature) => Boolean(art.creatures[creature.id])),
    [art],
  );

  useEffect(() => {
    const box = boxRef.current;
    const track = trackRef.current;
    if (!box || !track) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const items = Array.from(track.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    );
    if (items.length < 2) return undefined;

    const pitch = items[1].offsetLeft - items[0].offsetLeft;
    const half = items[0].offsetWidth / 2;
    if (pitch <= 0) return undefined;

    const reach = pitch * REACH_IN_ITEMS;
    let frame = 0;
    let swollen: HTMLElement[] = [];

    for (const item of items) item.style.opacity = String(RESTING_OPACITY);

    const clear = () => {
      for (const item of swollen) {
        item.style.opacity = String(RESTING_OPACITY);
        item.style.zIndex = "";
      }
      swollen = [];
    };

    const tick = () => {
      const boxRect = box.getBoundingClientRect();
      const start = track.getBoundingClientRect().left - boxRect.left;
      const middle = boxRect.width / 2;

      clear();

      const first = Math.max(0, Math.floor((middle - reach - start - half) / pitch));
      const last = Math.min(items.length - 1, Math.ceil((middle + reach - start - half) / pitch));

      for (let index = first; index <= last; index += 1) {
        const centre = start + index * pitch + half;
        const closeness = Math.max(0, 1 - Math.abs(centre - middle) / reach);
        if (closeness <= 0) continue;
        const opacity = RESTING_OPACITY + (1 - RESTING_OPACITY) * closeness * closeness;
        items[index].style.opacity = String(opacity);
        items[index].style.zIndex = closeness > 0.45 ? "1" : "";
        swollen.push(items[index]);
      }

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      for (const item of items) {
        item.style.opacity = "";
        item.style.zIndex = "";
      }
    };
  }, [roster.length]);

  if (roster.length === 0) return null;

  const strip = [...roster, ...roster];
  const style = {
    "--drift-seconds": String(roster.length * SECONDS_PER_CREATURE) + "s",
  } as CSSProperties;

  return (
    <div aria-hidden="true" ref={boxRef} className="drift-fade relative overflow-hidden">
      <div ref={trackRef} className="creature-drift flex w-max items-center gap-2" style={style}>
        {strip.map((creature, position) => (
          <CreatureIcon
            key={String(position) + "-" + creature.id}
            creature={creature}
            size="huge"
            className="h-32 w-32 m-4"
            inset="p-4"
            tone="glass"
            zoom={false}
            priority
          />
        ))}
      </div>
    </div>
  );
}
