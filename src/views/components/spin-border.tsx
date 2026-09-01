"use client";

import type { ElementType, ReactNode } from "react";
import { cn } from "@/shared/utils/class-names";

interface SpinBorderProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  innerClassName?: string;
  href?: string;
}

export function SpinBorder({
  children,
  as: Tag = "div",
  className,
  innerClassName,
  ...rest
}: SpinBorderProps) {
  return (
    <Tag className={cn("fury-spin-border", className)} {...rest}>
      <span className={cn("fury-spin-border-inner", innerClassName)}>{children}</span>
    </Tag>
  );
}
