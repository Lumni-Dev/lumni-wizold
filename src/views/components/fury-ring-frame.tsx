"use client";

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
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
      <span className="fury-ring-frame__track" aria-hidden="true" />
      <span className="fury-ring-frame__fill">
        <span
          className={cn(
            "fury-ring-frame__content",
            contentAlign === "start"
              ? "fury-ring-frame__content--start"
              : "fury-ring-frame__content--center",
            fillClassName,
          )}
        >
          {children}
        </span>
      </span>
    </Tag>
  );
}
