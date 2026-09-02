"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/class-names";
import { Select, type SelectOption } from "./select";

export const FILTER_COLUMN = "min-w-0 flex-1 basis-40 sm:basis-0 sm:min-w-[10rem]";

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
  onPageReset?: () => void;
  className?: string;
  disabled?: boolean;
  accent?: boolean;
}

export function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  onPageReset,
  className,
  disabled,
  accent,
}: FilterSelectProps<T>) {
  const pick = (next: T) => {
    onChange(next);
    onPageReset?.();
  };

  return (
    <Select
      compact
      className={cn(FILTER_COLUMN, className)}
      label={label}
      placeholder={options[0]?.label ?? label}
      value={value}
      options={toSelectOptions(options)}
      onChange={(next) => pick(next as T)}
      disabled={disabled}
      accent={accent}
      aria-label={label}
    />
  );
}

export function FilterRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-end gap-6", className)}>{children}</div>;
}
