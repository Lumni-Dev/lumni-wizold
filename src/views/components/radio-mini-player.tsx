"use client";

import { Pause, Play, SkipForward } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { radioStore } from "@/controllers/radio.store";
import { playSound } from "@/controllers/sound";
import { radioRepository } from "@/models/repositories/radio.repository";
import { Tooltip } from "./tooltip";

const CELL = "flex w-8 shrink-0 items-center justify-center self-stretch text-ink-faint transition-colors hover:text-ink";

export function RadioMiniPlayer() {
  const enabled = useSyncExternalStore(
    radioRepository.subscribe,
    radioRepository.enabled,
    radioRepository.serverSnapshot,
  );
  const { tracks, index } = useSyncExternalStore(
    radioStore.subscribe,
    radioStore.snapshot,
    radioStore.serverSnapshot,
  );

  useEffect(() => {
    radioStore.load();
  }, []);

  if (tracks.length === 0) return null;

  const current = tracks[Math.min(index, tracks.length - 1)] ?? null;
  const label = enabled ? (current?.name ?? "W-Radio") : "W-Radio";

  return (
    <Tooltip label={label} block>
      <div className="flex items-stretch overflow-hidden rounded-md border border-edge">
        <button
          type="button"
          onClick={() => {
            playSound("ui");
            radioRepository.setEnabled(!enabled);
          }}
          aria-label={enabled ? "Pausar o rádio" : "Tocar o rádio"}
          className={CELL + " border-r border-edge"}
        >
          {enabled ? (
            <Pause aria-hidden strokeWidth={1.75} className="h-4 w-4" />
          ) : (
            <Play aria-hidden strokeWidth={1.75} className="h-4 w-4" />
          )}
        </button>
        <div className="min-w-0 flex-1 px-3 py-2">
          <p className="truncate text-[10px] uppercase tracking-[0.16em] text-ink-faint">W-Radio</p>
          <p className="truncate font-mono text-[11px] text-ink">
            {enabled ? (current?.name ?? "...") : "Desligado"}
          </p>
        </div>
        {enabled ? (
          <button
            type="button"
            onClick={() => {
              playSound("ui");
              radioStore.next();
            }}
            aria-label="Próxima música"
            className={CELL + " border-l border-edge"}
          >
            <SkipForward aria-hidden strokeWidth={1.75} className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </Tooltip>
  );
}
