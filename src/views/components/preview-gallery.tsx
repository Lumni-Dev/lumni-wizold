"use client";
import { useEffect, useState } from "react";
import type { PreviewShot } from "@/models/data/preview";
import { cn } from "@/shared/utils/class-names";
import { ActionIcon } from "./app-icon";
import { Chip } from "./chip";
import { CornerAccents } from "./corner-accents";
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
export function PreviewGallery({ shots }: { shots: readonly PreviewShot[] }) {
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (held) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % shots.length);
    }, ROTATION_MS);
    return () => window.clearTimeout(timer);
  }, [held, index, shots.length]);
  const shot = shots[index];
  const step = (amount: number) =>
    setIndex((current) => (current + amount + shots.length) % shots.length);
  return (
    <div
      className="relative rounded-lg border border-edge bg-surface/80"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <div className="relative aspect-[1280/648] w-full overflow-hidden rounded-t-lg border-b border-edge bg-black">
        {shots.map((one, position) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={one.key}
            src={one.image}
            alt={one.label}
            decoding="sync"
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
              position === index ? "opacity-100" : "opacity-0",
            )}
          />
        ))}

        <Arrow action="previous" label="Tela anterior" side="left" onClick={() => step(-1)} />
        <Arrow action="next" label="Próxima tela" side="right" onClick={() => step(1)} />
      </div>

      <div className="space-y-1 border-b border-edge p-4">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">{shot.label}</p>
        <p className="text-sm text-ink">{shot.title}</p>
        <p className="text-xs leading-relaxed text-ink-soft">{shot.text}</p>
      </div>

      <div className="flex flex-wrap gap-2 p-4">
        {shots.map((one, position) => (
          <Chip
            key={one.key}
            active={position === index}
            aria-current={position === index}
            onClick={() => setIndex(position)}
          >
            {one.label}
          </Chip>
        ))}
      </div>

      <CornerAccents />
    </div>
  );
}
