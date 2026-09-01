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
    <div id={id} className={cn("columns-1 gap-6 lg:columns-2", className)}>
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
    <div id={id} className={cn("mb-6 scroll-mt-28 break-inside-avoid", className)}>
      {children}
    </div>
  );
}
