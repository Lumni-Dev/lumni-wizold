"use client";

import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shared/utils/class-names";

const MAX_WIDTH = 240;
const GAP = 14;

export function Tooltip({
  label,
  children,
  block = false,
  className,
}: {
  label?: ReactNode;
  children: ReactNode;
  block?: boolean;
  className?: string;
}) {
  const [at, setAt] = useState<{ left: number; top: number } | null>(null);

  if (!label) return <>{children}</>;

  const place = (event: { clientX: number; clientY: number }) => {
    setAt({
      left: Math.min(event.clientX + GAP, window.innerWidth - MAX_WIDTH - GAP),
      top: Math.min(event.clientY + GAP, window.innerHeight - 96),
    });
  };

  const Wrapper = block ? "div" : "span";

  return (
    <Wrapper
      className={cn(block ? "block" : "inline-flex", className)}
      onMouseEnter={place}
      onMouseMove={place}
      onMouseLeave={() => setAt(null)}
    >
      {children}
      {at
        ? createPortal(
            <span
              role="tooltip"
              style={{ left: at.left, top: at.top, maxWidth: MAX_WIDTH }}
              className={cn(
                "pointer-events-none fixed z-40 rounded-md border border-edge-strong bg-surface",
                "px-3 py-2 text-[11px] leading-relaxed text-ink-soft",
                "shadow-[0_12px_32px_-12px_rgba(0,0,0,0.95)]",
              )}
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </Wrapper>
  );
}
