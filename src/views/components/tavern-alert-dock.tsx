"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { dismissTavernAlert, tavernAlertStore } from "@/controllers/tavern-alert.store";
import { tavernPushRepository } from "@/models/repositories/tavern-push.repository";
import { formatDay } from "@/shared/utils/format";
import { ActionIcon, NavIcon } from "./app-icon";
import { Button } from "./button";
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
          <div className="overflow-hidden rounded-lg border border-edge bg-surface/80 backdrop-blur shadow-[0_12px_32px_-12px_rgba(0,0,0,0.95)]">
            <div className="flex items-center gap-2 border-b border-edge bg-surface-high/40 px-3 py-2">
              <NavIcon href="/tavern" className="shrink-0 text-ink-faint" />
              <Link
                href="/tavern"
                className="min-w-0 flex-1 truncate text-[10px] uppercase tracking-[0.16em] text-ink"
              >
                {alert.roomName}
              </Link>
              <Button
                variant="outline"
                icon
                aria-label="Fechar aviso"
                onClick={() => dismissTavernAlert(alert.id)}
              >
                <ActionIcon action="stop" />
              </Button>
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
