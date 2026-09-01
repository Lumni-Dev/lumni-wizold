"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { dismissTavernAlert, tavernAlertStore } from "@/controllers/tavern-alert.store";
import { tavernPushRepository } from "@/models/repositories/tavern-push.repository";
import { formatDay } from "@/shared/utils/format";
import { GLASS_SECTION } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
import { NavIcon } from "./app-icon";
import { CornerAccents } from "./corner-accents";
import { List, ListRow } from "./list";

export function TavernAlertDock() {
  const pathname = usePathname();
  const alertsOn = useSyncExternalStore(
    tavernPushRepository.subscribe,
    tavernPushRepository.enabled,
    tavernPushRepository.serverSnapshot,
  );
  const alerts = useSyncExternalStore(
    tavernAlertStore.subscribe,
    tavernAlertStore.snapshot,
    tavernAlertStore.serverSnapshot,
  );

  if (!alertsOn || pathname.startsWith("/tavern") || alerts.length === 0) return null;

  return (
    <>
      {alerts.map((alert) => (
        <aside
          key={alert.id}
          aria-label={"Mensagem na mesa " + alert.roomName}
          className="toast-in pointer-events-auto relative w-full"
        >
          <div className={cn("overflow-hidden rounded-lg border border-edge shadow-[0_12px_32px_-12px_rgba(0,0,0,0.95)]", GLASS_SECTION)}>
            <div className="flex items-center gap-2 border-b border-edge px-3 py-2">
              <NavIcon href="/tavern" className="shrink-0 text-ink-faint" />
              <Link
                href="/tavern"
                className="min-w-0 flex-1 truncate text-[10px] uppercase tracking-[0.16em] text-ink"
              >
                {alert.roomName}
              </Link>
              <button
                type="button"
                onClick={() => dismissTavernAlert(alert.id)}
                aria-label="Fechar aviso"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-edge text-ink-faint transition-colors hover:border-edge-strong hover:text-ink"
              >
                <span aria-hidden="true" className="text-sm leading-none">
                  ×
                </span>
              </button>
            </div>
            <List>
              <ListRow layout="column">
                <p className="text-xs leading-relaxed text-ink">
                  <span className="text-ink-soft">{alert.authorName}: </span>
                  {alert.text}
                </p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  {formatDay(alert.at)}
                </p>
              </ListRow>
            </List>
          </div>
          <CornerAccents />
        </aside>
      ))}
    </>
  );
}
