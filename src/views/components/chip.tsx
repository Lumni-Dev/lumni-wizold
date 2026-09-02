"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { playClick } from "@/controllers/sound";
import { CONTROL_HEIGHT, LOOSE_CONTROL_SURFACE, LOOSE_CONTROL_SURFACE_ACTIVE, LOOSE_CONTROL_SURFACE_HOVER } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
import { CornerAccents } from "./corner-accents";
import { Spinner } from "./spinner";

export function chipClass(active = false, className?: string): string {
  return cn(
    "inline-flex " + CONTROL_HEIGHT + " shrink-0 items-center rounded-md border px-3",
    "text-[10px] uppercase tracking-[0.16em] transition-colors",
    active
      ? LOOSE_CONTROL_SURFACE_ACTIVE
      : LOOSE_CONTROL_SURFACE + " text-ink-soft " + LOOSE_CONTROL_SURFACE_HOVER,
    className,
  );
}

export function ChipFrame({
  active = false,
  className,
  children,
}: {
  active?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      {children}
      {active ? <CornerAccents scale="icon" inside /> : null}
    </span>
  );
}

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Chip({ active = false, className, onClick, children, ...rest }: ChipProps) {
  const [waiting, setWaiting] = useState(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const press = (event: MouseEvent<HTMLButtonElement>) => {
    if (waiting) return;
    playClick();
    const outcome: unknown = onClick?.(event);
    if (outcome instanceof Promise) {
      setWaiting(true);
      void outcome.finally(() => {
        if (aliveRef.current) setWaiting(false);
      });
    }
  };

  return (
    <ChipFrame active={active}>
      <button
        type="button"
        className={cn(
          chipClass(active, className),
          waiting && "pointer-events-none relative",
        )}
        aria-busy={waiting || undefined}
        onClick={press}
        {...rest}
      >
        {waiting ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner tone="ember" />
          </span>
        ) : null}
        <span className={cn("inline-flex items-center gap-2", waiting && "invisible")}>
          {children}
        </span>
      </button>
    </ChipFrame>
  );
}
