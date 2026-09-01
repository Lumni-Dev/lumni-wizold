"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { activityRuntimeStore } from "@/controllers/activity-runtime";
import { useGame } from "@/controllers/game.context";
import { cn } from "@/shared/utils/class-names";
import { Bar } from "./bar";
import { Button } from "./button";

export function ActivityDock() {
  const pathname = usePathname();
  const { activity, setActivity } = useGame();
  const runtime = useSyncExternalStore(
    activityRuntimeStore.subscribe,
    activityRuntimeStore.snapshot,
    activityRuntimeStore.serverSnapshot,
  );
  const dock = runtime.dock;

  if (!activity || !dock) return null;
  if (pathname === dock.href) return null;

  const barLabel =
    dock.cooldown !== null
      ? "Parar em " + dock.cooldown + "s"
      : dock.beat > 0
        ? dock.detail
        : dock.detail;

  return (
    <aside
      aria-label="Atividade em andamento"
      className={cn(
        "border-b border-edge bg-surface/95 backdrop-blur",
        "shadow-[0_8px_24px_rgba(0,0,0,0.35)]",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href={dock.href} className="min-w-0 flex-1 space-y-1.5">
          <p className="truncate text-[10px] uppercase tracking-[0.16em] text-ink">{dock.title}</p>
          <Bar
            label={barLabel}
            current={dock.beat}
            maximum={dock.max}
            tone={dock.tone}
            glows={dock.cooldown === null && dock.beat > 0}
            wraps
          />
        </Link>
        {dock.canStop ? (
          <Button variant="secondary" onClick={() => setActivity(null)}>
            Parar
          </Button>
        ) : (
          <span className="hidden shrink-0 text-[10px] uppercase tracking-[0.16em] text-ink-faint sm:block">
            Em curso
          </span>
        )}
      </div>
    </aside>
  );
}
