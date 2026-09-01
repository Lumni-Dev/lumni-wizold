"use client";

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { FURY_RING_FILL } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";

export type FuryRingContentAlign = "center" | "start";

type FuryRingFrameProps<T extends ElementType = "div"> = {
  children: ReactNode;
  className?: string;
  fillClassName?: string;
  contentAlign?: FuryRingContentAlign;
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function FuryRingFrame<T extends ElementType = "div">({
  children,
  className,
  fillClassName,
  contentAlign = "center",
  as,
  ...rest
}: FuryRingFrameProps<T>) {
  const Tag = (as ?? "div") as ElementType;

  return (
    <Tag className={cn("fury-ring-frame", className)} {...rest}>
      <span
        className={cn(
          "fury-ring-frame__content",
          FURY_RING_FILL,
          contentAlign === "start"
            ? "fury-ring-frame__content--start"
            : "fury-ring-frame__content--center",
          fillClassName,
        )}
      >
        {children}
      </span>
    </Tag>
  );
}
