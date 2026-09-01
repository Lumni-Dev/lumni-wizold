import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { playClick } from "@/controllers/sound";
import { cn } from "@/shared/utils/class-names";

export function chipClass(active = false, className?: string): string {
  return cn(
    "inline-flex h-8 shrink-0 items-center rounded-md border px-3",
    "text-[10px] uppercase tracking-[0.16em] transition-colors",
    active
      ? "border-ember bg-surface-high text-ink"
      : "border-edge bg-surface text-ink-soft hover:border-edge-strong hover:text-ink",
    className,
  );
}

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Chip({ active = false, className, onClick, ...rest }: ChipProps) {
  const press = (event: MouseEvent<HTMLButtonElement>) => {
    playClick();
    onClick?.(event);
  };

  return (
    <button type="button" className={chipClass(active, className)} onClick={press} {...rest} />
  );
}
