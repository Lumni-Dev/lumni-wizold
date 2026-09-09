"use client";

import { useMemo, useSyncExternalStore } from "react";
import { tavernChatStore } from "@/controllers/tavern-chat.store";
import { tavernUserStore, type TavernReadMap } from "@/controllers/tavern-user.store";
import { useIsDesktop } from "@/controllers/use-is-desktop";
import { useTavern } from "@/controllers/use-tavern";
import { useT } from "@/controllers/use-locale";
import { chatDockRepository } from "@/models/repositories/chat-dock.repository";
import { roomTitle } from "@/models/entities/tavern";
import { GLASS_SECTION } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
import { ActionIcon, NavIcon } from "./app-icon";
import { CornerAccents } from "./corner-accents";
import { Tooltip } from "./tooltip";

// The chat folded into the corner: the table's name, what it said while it was
// away, and the two ways out, back to the window or up from the chair.
export function TavernChatDock() {
  const t = useT();
  const isDesktop = useIsDesktop();
  const chat = useSyncExternalStore(
    tavernChatStore.subscribe,
    tavernChatStore.snapshot,
    tavernChatStore.serverSnapshot,
  );
  const minimized = useSyncExternalStore(
    chatDockRepository.subscribe,
    chatDockRepository.minimized,
    chatDockRepository.serverSnapshot,
  );
  const folded = isDesktop && chat.open && chat.roomId !== null && minimized;
  const { identity, activeRoom } = useTavern(folded ? chat.roomId : null);
  const readMap = useSyncExternalStore(
    tavernUserStore.subscribeRead,
    tavernUserStore.readSnapshot,
    (): TavernReadMap => ({}),
  );

  const unread = useMemo(() => {
    if (!activeRoom || !identity) return 0;
    const lastRead = readMap[activeRoom.id] ?? "";
    return activeRoom.messages.filter(
      (message) =>
        message.at > lastRead &&
        message.authorId !== "system" &&
        message.authorId !== identity.id,
    ).length;
  }, [activeRoom, identity, readMap]);

  if (!folded || !activeRoom) return null;

  return (
    <aside
      aria-label={t("Chat of " + roomTitle(activeRoom, true))}
      className="pointer-events-auto relative w-full"
    >
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-edge shadow-[0_12px_32px_-12px_rgba(0,0,0,0.95)]",
          GLASS_SECTION,
        )}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          <NavIcon href="/tavern" className="shrink-0 text-ink-faint" />
          <button
            type="button"
            onClick={() => chatDockRepository.setMinimized(false)}
            className="min-w-0 flex-1 truncate text-left text-[10px] uppercase tracking-[0.16em] text-ink"
          >
            {activeRoom.name}
          </button>
          {unread > 0 ? (
            <span className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded border border-ember bg-ember px-1 font-mono text-[10px] font-bold tracking-normal text-base">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
          <Tooltip label="Open chat">
            <button
              type="button"
              onClick={() => chatDockRepository.setMinimized(false)}
              aria-label={t("Open chat of " + roomTitle(activeRoom, true))}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-edge text-ink-faint transition-colors hover:border-edge-strong hover:text-ink"
            >
              <ActionIcon action="expand" />
            </button>
          </Tooltip>
          <Tooltip label="Close chat">
            <button
              type="button"
              onClick={() => {
                chatDockRepository.setMinimized(false);
                tavernChatStore.closeWindow();
              }}
              aria-label={t("Close chat of " + roomTitle(activeRoom, true))}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-edge text-ink-faint transition-colors hover:border-edge-strong hover:text-ink"
            >
              <span aria-hidden="true" className="text-sm leading-none">
                ×
              </span>
            </button>
          </Tooltip>
        </div>
      </div>
      <CornerAccents />
    </aside>
  );
}
