"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { LANDING_PARALLAX_BACK } from "@/shared/constants/site";
import { cn } from "@/shared/utils/class-names";

const MAX_SHIFT = 30;
const MAX_TILT = 5;
const BG_SCALE = 1.24;

type Motion = { x: number; y: number; rx: number; ry: number };

const REST: Motion = { x: 0, y: 0, rx: 0, ry: 0 };

function motionFromPointer(rect: DOMRect, clientX: number, clientY: number): Motion {
  const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
  const ny = ((clientY - rect.top) / rect.height) * 2 - 1;

  return {
    x: nx * MAX_SHIFT,
    y: ny * MAX_SHIFT * 0.72,
    ry: nx * MAX_TILT,
    rx: -ny * MAX_TILT * 0.7,
  };
}

export function LandingParallaxBanner({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [motion, setMotion] = useState<Motion>(REST);
  const [live, setLive] = useState(false);

  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = boxRef.current;
    if (!box) return;
    setLive(true);
    setMotion(motionFromPointer(box.getBoundingClientRect(), event.clientX, event.clientY));
  };

  const pointerLeave = () => {
    setLive(false);
    setMotion(REST);
  };

  return (
    <div
      ref={boxRef}
      className={cn(
        "relative aspect-square w-full overflow-hidden border-b border-edge [perspective:920px]",
        className,
      )}
      onPointerMove={pointerMove}
      onPointerLeave={pointerLeave}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 [transform-style:preserve-3d]">
        <div
          className={cn(
            "absolute inset-0 will-change-transform",
            live ? "transition-transform duration-150 ease-out" : "transition-transform duration-500 ease-out",
          )}
          style={{
            transform:
              "translate3d(" +
              motion.x +
              "px," +
              motion.y +
              "px,-36px) rotateX(" +
              motion.rx +
              "deg) rotateY(" +
              motion.ry +
              "deg) scale(" +
              BG_SCALE +
              ")",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LANDING_PARALLAX_BACK} alt="" className="h-full w-full object-cover" />
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-base/10 to-base/50"
      />
      <div className="relative z-10 flex h-full w-full items-end justify-center p-5">
        <div className="max-h-[92%] w-full">{children}</div>
      </div>
    </div>
  );
}
