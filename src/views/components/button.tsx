"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type MouseEvent } from "react";
import { playClick } from "@/controllers/sound";
import { cn } from "@/shared/utils/class-names";
import { Spinner } from "./spinner";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "small" | "medium";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: boolean;
  /** Explicit pending state, for forms that own their own submit flow. */
  busy?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "border border-ember bg-ember text-base " +
    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] hover:brightness-110",
  secondary: "border border-edge-strong bg-surface-high text-ink hover:bg-surface-top",
  ghost: "text-ink-soft hover:bg-surface-high hover:text-ink",
  outline: "border border-edge-strong text-ink-soft hover:bg-surface-high hover:text-ink",
};

const SIZES: Record<ButtonSize, string> = {
  small: "h-8 px-3 text-[11px]",
  medium: "h-10 px-4 text-xs",
};

const ICON_SIZES: Record<ButtonSize, string> = {
  small: "h-8 w-8",
  medium: "h-10 w-10",
};

export function Button({
  variant = "secondary",
  size = "small",
  fullWidth = false,
  icon = false,
  busy = false,
  className,
  children,
  onClick,
  ...rest
}: ButtonProps) {
  // Every async action in the game returns a Promise: when a click hands one
  // back, the button holds itself busy until it settles, wears the theme's
  // circle and refuses a second click, so no screen wires a loading by hand.
  const [waiting, setWaiting] = useState(false);
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const pending = busy || waiting;

  const press = (event: MouseEvent<HTMLButtonElement>) => {
    if (pending) return;
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
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium uppercase tracking-[0.16em]",
        "transition-colors duration-150 disabled:pointer-events-none disabled:opacity-35",
        VARIANTS[variant],
        icon ? ICON_SIZES[size] : SIZES[size],
        fullWidth && "w-full",
        pending && "pointer-events-none",
        className,
      )}
      aria-busy={pending || undefined}
      onClick={press}
      {...rest}
    >
      {pending ? <Spinner /> : null}
      {icon && pending ? null : children}
    </button>
  );
}
