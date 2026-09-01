"use client";

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { FURY_RING_FILL, FURY_RING_INNER_RADIUS, FURY_RING_RADIUS } from "@/shared/constants/ui";
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
    <Tag className={cn("fury-ring-frame", FURY_RING_RADIUS, className)} {...rest}>
      <div className="fury-ring-frame__gradient">
        <div
          className={cn("fury-ring-frame__fill", FURY_RING_INNER_RADIUS, FURY_RING_FILL, fillClassName)}
        >
          <div
            className={cn(
              "fury-ring-frame__content",
              contentAlign === "start"
                ? "fury-ring-frame__content--start"
                : "fury-ring-frame__content--center",
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </Tag>
  );
}
