"use client";
import { useState, type ReactNode } from "react";
import { cn } from "@/shared/utils/class-names";
import { CornerAccents } from "./corner-accents";
export type IconSize = "mini" | "small" | "medium" | "large" | "huge";
const MINI = "h-8 w-8";
const SMALL = "h-15 w-15";
const MEDIUM = "h-18 w-18";
const LARGE = "h-22 w-22";
const HUGE = "h-28 w-28";
const ICON_BOX: Record<IconSize, string> = {
  mini: MINI,
  small: SMALL,
  medium: MEDIUM,
  large: LARGE,
  huge: HUGE,
};
const FRAME_ROOM: Record<IconSize, string> = {
  mini: "m-1",
  small: "m-2",
  medium: "m-3",
  large: "m-4",
  huge: "m-5",
};
const ICON_TEXT: Record<IconSize, string> = {
  mini: "text-[10px]",
  small: "text-sm",
  medium: "text-lg",
  large: "text-xl",
  huge: "text-2xl",
};
type FrameTone = "default" | "strong";
const TONES: Record<FrameTone, string> = {
  default: "border-edge bg-base text-ink-faint",
  strong: "border-edge-strong bg-charcoal text-ink-soft",
};
export function IconFrame({
  size = "medium",
  tone = "default",
  className,
  children,
}: {
  size?: IconSize;
  tone?: FrameTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("relative flex shrink-0", ICON_BOX[size], FRAME_ROOM[size], className)}
    >
      <span
        className={cn(
          "slot-well relative flex h-full w-full items-center justify-center overflow-hidden rounded-md border font-mono",
          ICON_TEXT[size],
          TONES[tone],
        )}
      >
        {children}
      </span>
      <CornerAccents scale="icon" />
    </span>
  );
}
const PREVIEW_SIZE = 220;
const ICON_PAD = "p-[5px]";
export function IconArt({
  source,
  padded = true,
  glow = false,
  inset,
}: {
  source: string;
  padded?: boolean;
  glow?: boolean;
  inset?: string;
}) {
  const [preview, setPreview] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const place = (event: { clientX: number; clientY: number }) => {
    const gap = 16;
    setPreview({
      left: Math.min(event.clientX + gap, window.innerWidth - PREVIEW_SIZE - gap),
      top: Math.min(
        Math.max(event.clientY - PREVIEW_SIZE / 2, gap),
        window.innerHeight - PREVIEW_SIZE - gap,
      ),
    });
  };
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={source}
        alt=""
        loading="lazy"
        className={cn(
          "h-full w-full cursor-zoom-in object-cover drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)]",
          inset ?? (padded && ICON_PAD),
        )}
        onMouseEnter={place}
        onMouseMove={place}
        onMouseLeave={() => setPreview(null)}
      />
      {glow ? (
        <span className="item-glow pointer-events-none absolute -inset-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      ) : null}

      {preview ? (
        <span
          aria-hidden="true"
          className="pointer-events-none fixed z-40"
          style={{
            left: preview.left,
            top: preview.top,
            width: PREVIEW_SIZE,
            height: PREVIEW_SIZE,
          }}
        >
          <span className="slot-well relative flex h-full w-full overflow-hidden rounded-lg border border-edge-strong bg-surface shadow-[0_28px_64px_-16px_rgba(0,0,0,0.98),0_10px_28px_-10px_rgba(0,0,0,0.85)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={source}
              alt=""
              className={cn(
                "h-full w-full object-cover drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)]",
                inset ? "p-[16px]" : padded && "p-[14px]",
              )}
            />
            {glow ? <span className="item-glow pointer-events-none absolute -inset-1/2" /> : null}
          </span>
          <CornerAccents />
        </span>
      ) : null}
    </>
  );
}
