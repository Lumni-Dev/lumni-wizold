"use client";

import { useMemo } from "react";
import { seededRandom } from "@/shared/utils/random";

const SIZE = 25;

function seedOf(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619) >>> 0;
  }
  return hash;
}

function finderDark(x: number, y: number): boolean | null {
  const corners: readonly [number, number][] = [
    [0, 0],
    [SIZE - 7, 0],
    [0, SIZE - 7],
  ];

  for (const [cornerX, cornerY] of corners) {
    const dx = x - cornerX;
    const dy = y - cornerY;
    if (dx < -1 || dx > 7 || dy < -1 || dy > 7) continue;
    if (dx < 0 || dx > 6 || dy < 0 || dy > 6) return false;

    const ring = dx === 0 || dx === 6 || dy === 0 || dy === 6;
    const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
    return ring || core;
  }

  return null;
}

export function PixQr({ value }: { value: string }) {
  const modules = useMemo(() => {
    const random = seededRandom(seedOf(value));
    const dark: { x: number; y: number }[] = [];

    for (let y = 0; y < SIZE; y += 1) {
      for (let x = 0; x < SIZE; x += 1) {
        const finder = finderDark(x, y);
        if (finder ?? random() < 0.45) dark.push({ x, y });
      }
    }

    return dark;
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-md bg-highlight p-3">
        <svg
          viewBox={"0 0 " + SIZE + " " + SIZE}
          className="h-40 w-40"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          {modules.map((cell) => (
            <rect
              key={cell.x + "-" + cell.y}
              x={cell.x}
              y={cell.y}
              width={1}
              height={1}
              fill="var(--color-base)"
            />
          ))}
        </svg>
      </div>
      <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">Pix de demonstração</p>
    </div>
  );
}
