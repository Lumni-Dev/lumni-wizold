"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/class-names";
import { CornerAccents, MarkNested, useNested } from "./corner-accents";

type CardTone = "default" | "highlighted" | "empty";
type CardHeight = "content" | "fill";

interface CardProps {
  children: ReactNode;
  tone?: CardTone;
  height?: CardHeight;
  interactive?: boolean;
  className?: string;
}

const TONES: Record<CardTone, string> = {
  default: "border-edge bg-surface-high/50",
  highlighted: "border-edge-strong bg-surface-high",
  empty: "border-dashed border-edge bg-transparent",
};

export function Card({
  children,
  tone = "default",
  height = "content",
  interactive = false,
  className,
}: CardProps) {
  const nested = useNested();

  return (
    <div className={cn("relative", height === "fill" ? "h-full" : "h-fit", className)}>
      <article
        className={cn(
          "group flex h-full flex-col overflow-hidden rounded-lg border transition-colors",
          TONES[tone],
          interactive && tone === "default" && "hover:border-edge-strong",
        )}
      >
        <MarkNested>{children}</MarkNested>
      </article>
      {nested ? null : <CornerAccents />}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 border-b border-edge p-4", className)}>
      {children}
    </div>
  );
}

export function CardBody({
  children,
  direction = "column",
  className,
}: {
  children: ReactNode;
  direction?: "column" | "row";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 gap-3 p-4",
        direction === "column" ? "flex-col" : "flex-row items-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mt-auto flex min-h-16 flex-wrap items-center justify-between gap-3 border-t border-edge p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
