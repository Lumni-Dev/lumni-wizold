"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/class-names";

export function WikiMasonry({
  id,
  children,
  className,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div id={id} className={cn("space-y-6", className)}>
      {children}
    </div>
  );
}

export function WikiMasonryItem({
  id,
  children,
  className,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div id={id} className={cn("scroll-mt-28", className)}>
      {children}
    </div>
  );
}
