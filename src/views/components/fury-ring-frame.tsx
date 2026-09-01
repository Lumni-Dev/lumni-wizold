"use client";

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/shared/utils/class-names";

type FuryRingFrameProps<T extends ElementType = "div"> = {
  children: ReactNode;
  className?: string;
  fillClassName?: string;
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function FuryRingFrame<T extends ElementType = "div">({
  children,
  className,
  fillClassName,
  as,
  ...rest
}: FuryRingFrameProps<T>) {
  const Tag = (as ?? "div") as ElementType;

  return (
    <Tag className={cn("fury-ring-frame", className)} {...rest}>
      <span className="fury-ring-frame__track" aria-hidden="true" />
      <span className={cn("fury-ring-frame__fill", fillClassName)}>{children}</span>
    </Tag>
  );
}
