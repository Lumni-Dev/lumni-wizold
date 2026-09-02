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
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const tone = useCardTone();

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
