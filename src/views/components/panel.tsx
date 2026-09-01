"use client";

import type { ReactNode } from "react";
import { ICON_FRAME_INSET, GLASS_SECTION } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
import { CornerAccents, MarkNested, useNested } from "./corner-accents";

type PanelPadding = "normal" | "none";
type PanelHeight = "content" | "fill";

interface PanelProps {
  id?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  height?: PanelHeight;
  padding?: PanelPadding;
  className?: string;
}

export function Panel({
  id,
  title,
  description,
  action,
  footer,
  children,
  height = "content",
  padding = "normal",
  className,
}: PanelProps) {
  const nested = useNested();

  return (
    <div id={id} className={cn("relative", height === "fill" ? "h-full" : "h-fit", className)}>
      <section
        className={cn(
          "overflow-hidden rounded-lg border border-edge " + GLASS_SECTION,
          "shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]",
          height === "fill" && "flex h-full flex-col",
        )}
      >
        {title ? (
          <header className="flex items-center justify-between gap-3 border-b border-edge px-4 py-3">
            <div className="min-w-0 space-y-1">
              <h2 className="heading text-[11px] text-ink">{title}</h2>
              {description ? <p className="text-xs text-ink-faint">{description}</p> : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </header>
        ) : null}
        <div className={cn(padding === "normal" && "p-4", height === "fill" && "flex-1")}>
          <MarkNested>{children}</MarkNested>
        </div>
        {footer ? <div className="border-t border-edge p-4">{footer}</div> : null}
      </section>
      {nested ? null : <CornerAccents />}
    </div>
  );
}
