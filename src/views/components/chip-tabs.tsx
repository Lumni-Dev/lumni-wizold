"use client";

import { cn } from "@/shared/utils/class-names";
import { Chip } from "./chip";

interface ChipTabsProps<T extends string> {
  tabs: readonly { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
}

export function ChipTabs<T extends string>({ tabs, value, onChange, className }: ChipTabsProps<T>) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tabs.map((tab) => (
        <Chip key={tab.key} active={tab.key === value} onClick={() => onChange(tab.key)}>
          {tab.label}
        </Chip>
      ))}
    </div>
  );
}
