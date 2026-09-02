import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import { playClick } from "@/controllers/sound";
import { CONTROL_HEIGHT, LOOSE_CONTROL_SURFACE, LOOSE_CONTROL_SURFACE_ACTIVE, LOOSE_CONTROL_SURFACE_HOVER } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
import { CornerAccents } from "./corner-accents";

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
