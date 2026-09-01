"use client";

import { useEffect } from "react";
import { useGame } from "@/controllers/game.context";
import { GLASS_SECTION } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
import { ActivityDock } from "../components/activity-dock";
import { SourceIcon } from "../components/app-icon";
import { CornerAccents } from "../components/corner-accents";
import { PresenceDot } from "../components/presence-dot";
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
              "overflow-hidden rounded-lg border shadow-[0_12px_32px_-12px_rgba(0,0,0,0.95)]",
              GLASS_SECTION,
              line.ok ? "border-edge" : "border-ink-faint",
            )}
          >
            <div className="flex items-center gap-2 border-b border-edge px-3 py-2">
              <SourceIcon source={line.source} className="shrink-0 text-ink-faint" />
              {line.dot ? <PresenceDot status={line.dot} /> : null}
              <span className="heading min-w-0 flex-1 truncate text-[10px] text-ink">{line.source}</span>
              <button
                type="button"
                onClick={() => dismissNotice(line.id)}
                aria-label={"Fechar aviso de " + line.source}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-edge text-ink-faint transition-colors hover:border-edge-strong hover:text-ink"
              >
                <span aria-hidden="true" className="text-sm leading-none">
                  ×
                </span>
              </button>
            </div>
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
