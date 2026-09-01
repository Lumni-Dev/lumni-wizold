"use client";

import { useEffect } from "react";
import { useGame } from "@/controllers/game.context";
import { cn } from "@/shared/utils/class-names";
import { ActivityDock } from "../components/activity-dock";
import { SourceIcon } from "../components/app-icon";
import { CornerAccents } from "../components/corner-accents";
import { TavernAlertDock } from "../components/tavern-alert-dock";

const DURATION_MS = 4000;

export function GameCorner() {
  const { notices, dismissNotice } = useGame();
  const oldest = notices[0];

  useEffect(() => {
    if (!oldest) return;

    const timer = window.setTimeout(() => dismissNotice(oldest.id), DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [oldest, dismissNotice]);

  return (
    <div
      aria-label="Avisos e atividade"
      className="pointer-events-none fixed bottom-6 right-6 z-60 flex w-[min(22rem,calc(100vw-3rem))] flex-col items-end gap-2"
    >
      {notices.map((line) => (
        <div key={line.id} className="toast-in pointer-events-auto relative w-full">
          <div
            className={cn(
              "overflow-hidden rounded-lg border bg-surface/80 backdrop-blur",
              "shadow-[0_12px_32px_-12px_rgba(0,0,0,0.95)]",
              line.ok ? "border-edge" : "border-ink-faint",
            )}
          >
            <p className="flex items-center gap-2 border-b border-edge bg-surface-high/40 px-3 py-2">
              <SourceIcon source={line.source} className="text-ink-faint" />
              <span className="heading truncate text-[10px] text-ink">{line.source}</span>
            </p>
            <p
              className={cn(
                "px-3 py-2 text-xs leading-relaxed",
                line.ok ? "text-ink" : "text-ink-soft",
              )}
            >
              {line.text}
            </p>
          </div>
          <CornerAccents />
        </div>
      ))}
      <TavernAlertDock />
      <ActivityDock />
    </div>
  );
}
