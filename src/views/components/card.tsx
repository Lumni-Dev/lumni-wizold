"use client";

import { createContext, useContext, type ReactNode } from "react";
import { cn } from "@/shared/utils/class-names";
import { ICON_FRAME_INSET, GLASS_SECTION, GLASS_SECTION_STRONG } from "@/shared/constants/ui";
import { CornerAccents, MarkNested, useNested } from "./corner-accents";

type CardTone = "default" | "highlighted" | "empty";
type CardHeight = "content" | "fill";
type CardLayout = "column" | "row";

const CardToneContext = createContext<CardTone>("default");

function useCardTone() {
  return useContext(CardToneContext);
}

interface CardProps {
  children: ReactNode;
  tone?: CardTone;
  height?: CardHeight;
  layout?: CardLayout;
  interactive?: boolean;
  className?: string;
}

const TONES: Record<CardTone, string> = {
  default: "border-edge " + GLASS_SECTION,
  highlighted: "border-edge-strong " + GLASS_SECTION_STRONG,
  empty: "border-dashed border-edge " + GLASS_SECTION,
};

export function Card({
  children,
  tone = "default",
  height = "content",
  layout = "column",
  interactive = false,
  className,
}: CardProps) {
  const nested = useNested();

  return (
    <div className={cn("relative", height === "fill" ? "h-full" : "h-fit", className)}>
      <article
        className={cn(
          "group flex h-full overflow-hidden rounded-lg border transition-colors",
          layout === "row" ? "flex-row" : "flex-col",
          TONES[tone],
          interactive && tone === "default" && "hover:border-edge-strong",
        )}
      >
        <CardToneContext.Provider value={tone}>
          <MarkNested>{children}</MarkNested>
        </CardToneContext.Provider>
      </article>
      {nested ? null : <CornerAccents />}
    </div>
  );
}

export function CardHeader({
  art,
  artSize = "default",
  children,
  className,
}: {
  art?: ReactNode;
  artSize?: "default" | "small";
  children: ReactNode;
  className?: string;
}) {
  const tone = useCardTone();

  if (art) {
    return (
      <div className={cn("flex items-stretch", tone !== "empty" && "border-b border-edge")}>
        <span
          className={cn(
            "flex aspect-square shrink-0 overflow-hidden border-r border-edge",
            tone === "empty" && "border-dashed",
            artSize === "small" ? "w-16 p-2 sm:w-20" : "w-20 p-3 sm:w-28",
          )}
        >
          {art}
        </span>
        <div className={cn("flex min-w-0 grow items-center gap-3 px-4 py-3", ICON_FRAME_INSET, className)}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4",
        ICON_FRAME_INSET,
        tone !== "empty" && "border-b border-edge",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardArt({ children, className }: { children: ReactNode; className?: string }) {
  const tone = useCardTone();

  return (
    <div
      className={cn(
        "flex w-2/5 shrink-0 items-center justify-center overflow-hidden",
        tone !== "empty" && "border-r border-edge",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardStack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex min-w-0 flex-1 flex-col", className)}>{children}</div>;
}

export function CardBody({
  children,
  direction = "column",
  padding = "default",
  className,
}: {
  children: ReactNode;
  direction?: "column" | "row";
  padding?: "default" | "none";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-1",
        padding === "none" ? undefined : "gap-3 p-4",
        direction === "column" ? "flex-col" : "flex-row items-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  const tone = useCardTone();

  return (
    <div
      className={cn(
        "mt-auto flex min-h-16 flex-wrap items-center justify-between gap-3 p-4",
        tone === "empty" ? "border-t border-dashed border-edge" : "border-t border-edge",
        className,
      )}
    >
      {children}
    </div>
  );
}
