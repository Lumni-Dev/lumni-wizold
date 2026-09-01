"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/class-names";
import { Select, type SelectOption } from "./select";

export function toSelectOptions<T extends string>(
  items: readonly { key: T; label: string }[],
): SelectOption[] {
  return items.map((item) => ({ value: item.key, label: item.label }));
}

interface FilterSelectProps<T extends string> {
  label: string;
  value: T;
  options: readonly { key: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
  disabled?: boolean;
}

export function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
  disabled,
}: FilterSelectProps<T>) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 basis-40 items-center gap-2 sm:basis-auto sm:min-w-[10rem]",
        className,
      )}
    >
      <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        {label}
      </span>
      <Select
        compact
        className="min-w-0 flex-1"
        placeholder={options[0]?.label ?? label}
        value={value}
        options={toSelectOptions(options)}
        onChange={(next) => onChange(next as T)}
        disabled={disabled}
        aria-label={label}
      />
    </div>
  );
}

export function FilterRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-2", className)}>{children}</div>;
}
