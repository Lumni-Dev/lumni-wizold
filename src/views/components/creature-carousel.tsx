"use client";

import { useEffect, useMemo, useState } from "react";
import { CREATURES } from "@/models/data/creatures";
import type { Creature } from "@/models/entities/creature";
import { formatNumber } from "@/shared/utils/format";
import { cn } from "@/shared/utils/class-names";
import { ActionIcon } from "./app-icon";
import { CornerAccents } from "./corner-accents";
import { CreatureIcon } from "./creature-icon";

const PER_PAGE = 6;
const ROTATION_MS = 7000;

function Arrow({
  action,
  label,
  side,
  onClick,
}: {
  action: "previous" | "next";
  label: string;
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "absolute top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md",
        "border border-edge bg-surface/80 text-ink-faint transition-colors",
        "hover:border-edge-strong hover:text-ink",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <ActionIcon action={action} className="h-4 w-4" />
    </button>
  );
}

export function CreatureCarousel() {
  const roster = useMemo<readonly Creature[]>(
    () => [...CREATURES].sort((left, right) => left.level - right.level),
    [],
  );
  const [start, setStart] = useState(0);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (held || roster.length === 0) return undefined;
    const timer = window.setTimeout(() => {
      setStart((current) => (current + PER_PAGE) % roster.length);
    }, ROTATION_MS);
    return () => window.clearTimeout(timer);
  }, [held, start, roster.length]);

  if (roster.length === 0) return null;

  const step = (amount: number) =>
    setStart((current) => (current + amount + roster.length) % roster.length);

  const page = Array.from(
    { length: Math.min(PER_PAGE, roster.length) },
    (_, offset) => roster[(start + offset) % roster.length],
  );

  return (
    <div
      className="relative rounded-lg border border-edge bg-surface/80"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <ul className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 xl:grid-cols-6">
        {page.map((creature, offset) => (
          <li
            key={String(start) + "-" + String(offset)}
            className="flex flex-col items-center gap-2 text-center"
          >
            <CreatureIcon creature={creature} size="large" />
            <span className="line-clamp-2 text-[11px] leading-tight text-ink">
              {creature.name}
            </span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              NV. {formatNumber(creature.level)}
            </span>
          </li>
        ))}
      </ul>

      <Arrow
        action="previous"
        label="Criaturas anteriores"
        side="left"
        onClick={() => step(-PER_PAGE)}
      />
      <Arrow
        action="next"
        label="Próximas criaturas"
        side="right"
        onClick={() => step(PER_PAGE)}
      />

      <CornerAccents />
    </div>
  );
}
