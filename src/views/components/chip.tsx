import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import { playClick } from "@/controllers/sound";
import { cn } from "@/shared/utils/class-names";
import { CornerAccents } from "./corner-accents";

export function chipClass(active = false, className?: string): string {
  return cn(
    "inline-flex h-8 shrink-0 items-center rounded-md border px-3",
    "text-[10px] uppercase tracking-[0.16em] transition-colors",
    active
      ? "border-edge bg-surface-high text-ink"
      : "border-edge bg-surface text-ink-soft hover:border-edge-strong hover:text-ink",
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
    <span className={cn("relative inline-flex", className)}>
      {children}
      {active ? <CornerAccents scale="icon" inside /> : null}
    </span>
  );
}

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Chip({ active = false, className, onClick, children, ...rest }: ChipProps) {
  const press = (event: MouseEvent<HTMLButtonElement>) => {
    playClick();
    onClick?.(event);
  };

  return (
    <ChipFrame active={active}>
      <button type="button" className={chipClass(active, className)} onClick={press} {...rest}>
        {children}
      </button>
    </ChipFrame>
  );
}
