"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { activityRuntimeStore } from "@/controllers/activity-runtime";
import { useGame } from "@/controllers/game.context";
import { activityDockRepository } from "@/models/repositories/activity-dock.repository";
import { ActionIcon, NavIcon } from "./app-icon";
import { Bar } from "./bar";
import { Button } from "./button";
import { CornerAccents } from "./corner-accents";

export function ActivityDock() {
  const pathname = usePathname();
  const { activity, setActivity } = useGame();
  const runtime = useSyncExternalStore(
    activityRuntimeStore.subscribe,
    activityRuntimeStore.snapshot,
    activityRuntimeStore.serverSnapshot,
  );
  const minimized = useSyncExternalStore(
    activityDockRepository.subscribe,
    activityDockRepository.minimized,
    activityDockRepository.serverSnapshot,
  );
  const dock = runtime.dock;

  if (!activity || !dock) return null;
  if (pathname === dock.href) return null;

  const barLabel =
    dock.cooldown !== null ? "Parar em " + dock.cooldown + "s" : dock.detail;

  if (minimized) {
    return (
      <div className="pointer-events-auto relative w-full">
        <div className="flex items-center gap-2 overflow-hidden rounded-lg border border-edge bg-surface/80 p-2 backdrop-blur shadow-[0_12px_32px_-12px_rgba(0,0,0,0.95)]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center border-r border-edge pr-2">
            <NavIcon href={dock.href} className="text-ember" />
          </span>
          <Link href={dock.href} className="min-w-0 flex-1 truncate text-[10px] uppercase tracking-[0.16em] text-ink">
            {dock.title}
          </Link>
          <Button
            icon
            variant="ghost"
            aria-label="Mostrar atividade"
            onClick={() => activityDockRepository.setMinimized(false)}
          >
            <ActionIcon action="expand" />
          </Button>
        </div>
        <CornerAccents />
      </div>
    );
  }

  return (
    <aside aria-label="Atividade em andamento" className="pointer-events-auto relative w-full">
      <div className="overflow-hidden rounded-lg border border-edge bg-surface/80 backdrop-blur shadow-[0_12px_32px_-12px_rgba(0,0,0,0.95)]">
        <div className="flex items-center gap-2 border-b border-edge bg-surface-high/40 px-3 py-2">
          <NavIcon href={dock.href} className="shrink-0 text-ink-faint" />
          <Link
            href={dock.href}
            className="min-w-0 flex-1 truncate text-[10px] uppercase tracking-[0.16em] text-ink"
          >
            {dock.title}
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              icon
              variant="ghost"
              aria-label="Minimizar"
              onClick={() => activityDockRepository.setMinimized(true)}
            >
              <ActionIcon action="collapse" />
            </Button>
            {dock.canStop ? (
              <Button icon variant="ghost" aria-label="Parar atividade" onClick={() => setActivity(null)}>
                <ActionIcon action="stop" />
              </Button>
            ) : null}
          </div>
        </div>
        <div className="p-3">
          <Bar
            label={barLabel}
            current={dock.beat}
            maximum={dock.max}
            tone={dock.tone}
            glows={dock.cooldown === null && dock.beat > 0}
            wraps
          />
        </div>
      </div>
      <CornerAccents />
    </aside>
  );
}
