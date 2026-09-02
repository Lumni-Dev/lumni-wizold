"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { tavernChatStore } from "@/controllers/tavern-chat.store";
import { useIsDesktop } from "@/controllers/use-is-desktop";
import { playSound } from "@/controllers/sound";
import { dismissTavernNotices } from "@/controllers/tavern-notify";
import { useGame } from "@/controllers/game.context";
import { listPack } from "@/controllers/pack.controller";
import { usePackPresence } from "@/controllers/use-pack-presence";
import { useTavern } from "@/controllers/use-tavern";
import type { PresenceStatus } from "@/models/entities/presence";
import {
  tavernReadRepository,
} from "@/models/repositories/tavern-read.repository";
import {
  tavernSentRepository,
  type TavernSentMap,
} from "@/models/repositories/tavern-sent.repository";
import { MESSAGE_COOLDOWN_MS, isPrivateTable } from "@/models/entities/tavern";
import { CornerAccents } from "./corner-accents";
import {
  TavernRoomChatComposer,
  TavernRoomChatMembers,
  TavernRoomChatMessages,
  tavernRoomChatAction,
} from "./tavern-room-chat";

function clampPosition(x: number, y: number, width: number, height: number) {
  const maxX = Math.max(16, window.innerWidth - width - 16);
  const maxY = Math.max(16, window.innerHeight - height - 16);
  return {
    x: Math.min(Math.max(16, x), maxX),
    y: Math.min(Math.max(16, y), maxY),
  };
}

export function TavernChatWindow() {
  const isDesktop = useIsDesktop();
  const chat = useSyncExternalStore(
    tavernChatStore.subscribe,
    tavernChatStore.snapshot,
    tavernChatStore.serverSnapshot,
  );
  const { state, character, notify, invite } = useGame();
  const { identity, rooms, ready, activeRoom, sendMessage, announceAway } = useTavern(
    chat.open ? chat.roomId : null,
  );
  const packIds = useMemo(() => listPack(state).map((mate) => mate.id), [state]);
  const packPresence = usePackPresence(packIds, Boolean(character) && chat.open);
  const chatPresence = useMemo(() => {
    const next: Record<string, PresenceStatus> = {};
    for (const id of packIds) next[id] = packPresence[id] ?? "offline";
    return next;
  }, [packIds, packPresence]);

  const [draft, setDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiRect, setEmojiRect] = useState<DOMRect | null>(null);
  const [invitingMemberId, setInvitingMemberId] = useState<string | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [sentBeat, setSentBeat] = useState(0);

  const emojiRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLUListElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const sentMapRef = useRef<TavernSentMap>({});

  const selfId = identity?.id ?? "";
  const lastMessageId = activeRoom?.messages[activeRoom.messages.length - 1]?.id ?? null;

  const markRoomRead = useCallback((roomId: string) => {
    const summary = rooms.find((entry) => entry.room.id === roomId);
    if (summary) dismissTavernNotices(summary.room.name);
    const lastAt = summary?.room.messages[summary.room.messages.length - 1]?.at;
    if (!lastAt) return;
    tavernReadRepository.mark(
      roomId,
      lastAt,
      rooms.map((entry) => entry.room.id),
    );
  }, [rooms]);

  useEffect(() => {
    if (!emojiOpen) return;
    const onDown = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setEmojiOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [emojiOpen]);

  useEffect(() => {
    sentMapRef.current = tavernSentRepository.load();
  }, []);

  useEffect(() => {
    const list = messagesRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lastMessageId]);

  const lastMineAt = useMemo(() => {
    if (!activeRoom) return null;
    for (let index = activeRoom.messages.length - 1; index >= 0; index -= 1) {
      if (activeRoom.messages[index].authorId === selfId) return activeRoom.messages[index].at;
    }
    return null;
  }, [activeRoom, selfId]);

  useEffect(() => {
    const compute = () => {
      const marker = chat.roomId ? sentMapRef.current[chat.roomId] : undefined;
      const left =
        marker !== undefined
          ? MESSAGE_COOLDOWN_MS - (Date.now() - marker)
          : lastMineAt
            ? MESSAGE_COOLDOWN_MS - (Date.now() - Date.parse(lastMineAt))
            : 0;
      return Math.max(0, Math.min(MESSAGE_COOLDOWN_MS, left));
    };
    const tick = () => {
      const left = compute();
      setCooldownLeft(left);
      if (left <= 0) window.clearInterval(interval);
    };
    const first = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 500);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, [lastMineAt, chat.roomId, sentBeat]);

  const lastMessageAt = activeRoom?.messages[activeRoom.messages.length - 1]?.at ?? null;
  useEffect(() => {
    if (!chat.open || !chat.roomId || !lastMessageAt) return;
    const timer = window.setTimeout(() => {
      markRoomRead(chat.roomId!);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [chat.open, chat.roomId, lastMessageAt, markRoomRead]);

  const closeChat = useCallback(() => {
    if (!activeRoom) return;
    playSound("door");
    markRoomRead(activeRoom.id);
    void announceAway(activeRoom.id);
    tavernChatStore.closeWindow();
    setDraft("");
    setEmojiOpen(false);
  }, [activeRoom, announceAway, markRoomRead]);

  useEffect(() => {
    if (!chat.open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeChat();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [chat.open, closeChat]);

  useEffect(() => {
    if (!chat.open || !chat.roomId) return;
    setDraft("");
    setEmojiOpen(false);
    setInvitingMemberId(null);
    setSentBeat(0);
    setCooldownLeft(0);
  }, [chat.roomId, chat.open]);

  useEffect(() => {
    if (!ready || !chat.open || !chat.roomId) return;
    const entry = rooms.find((summary) => summary.room.id === chat.roomId);
    if (!entry?.isMember) tavernChatStore.closeWindow();
  }, [ready, chat.open, chat.roomId, rooms]);

  useEffect(() => {
    if (!chat.open) return;
    const clamp = () => {
      const shell = shellRef.current;
      if (!shell) return;
      const rect = shell.getBoundingClientRect();
      const next = clampPosition(chat.x, chat.y, rect.width, rect.height);
      if (next.x !== chat.x || next.y !== chat.y) tavernChatStore.setPosition(next.x, next.y);
    };
    window.addEventListener("resize", clamp);
    clamp();
    return () => window.removeEventListener("resize", clamp);
  }, [chat.open, chat.x, chat.y]);

  if (!isDesktop || !chat.open || !chat.roomId || !activeRoom || !identity) return null;

  const profileHref = (memberId: string): string | null =>
    memberId === identity.id ? "/character" : "/ranking/" + memberId;

  async function submitMessage(event: FormEvent) {
    event.preventDefault();
    const result = await sendMessage(chat.roomId!, draft);
    if (!result) return;
    if (result.ok) {
      sentMapRef.current = { ...sentMapRef.current, [chat.roomId!]: Date.now() };
      tavernSentRepository.save(sentMapRef.current);
      setSentBeat((count) => count + 1);
      playSound("chat");
      setDraft("");
    } else notify(result.message, false, "Taverna");
  }

  async function inviteMember(member: { id: string; name: string }) {
    if (invitingMemberId) return;
    setInvitingMemberId(member.id);
    try {
      await invite(member);
    } finally {
      setInvitingMemberId(null);
    }
  }

  function startDrag(event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    const origin = event.target;
    if (origin instanceof Element && origin.closest("button")) return;
    event.preventDefault();
    const shell = shellRef.current;
    if (!shell) return;
    const offsetX = event.clientX - chat.x;
    const offsetY = event.clientY - chat.y;

    const onMove = (move: globalThis.PointerEvent) => {
      const rect = shell.getBoundingClientRect();
      const next = clampPosition(
        move.clientX - offsetX,
        move.clientY - offsetY,
        rect.width,
        rect.height,
      );
      tavernChatStore.setPosition(next.x, next.y);
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  return (
    <div
      ref={shellRef}
      className="pointer-events-auto fixed z-60 hidden w-[min(32rem,calc(100vw-2rem))] lg:block"
      style={{ left: chat.x, top: chat.y }}
    >
      <div className="relative w-full">
        <section
          role="dialog"
          aria-label={activeRoom.name}
          className="flex max-h-[min(32rem,calc(100svh-6rem))] w-full flex-col overflow-hidden rounded-lg border border-edge-strong bg-surface shadow-[0_24px_60px_-20px_rgba(0,0,0,0.95)]"
        >
          <header
            className="flex cursor-grab items-center gap-3 select-none border-b border-edge bg-surface-high px-4 py-3 active:cursor-grabbing"
            onPointerDown={startDrag}
          >
            <h2 className="heading min-w-0 flex-1 truncate text-[11px] text-ink">{activeRoom.name}</h2>
            <span className="shrink-0 font-mono text-[11px] text-ink-faint">
              {tavernRoomChatAction(activeRoom)}
            </span>
            <kbd className="hidden h-6 select-none items-center rounded-md border border-edge px-1.5 font-mono text-[10px] tracking-[0.1em] text-ink-faint sm:inline-flex">
              ESC
            </kbd>
            <button
              type="button"
              onClick={closeChat}
              aria-label={"Fechar chat de " + activeRoom.name}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-edge text-ink-faint transition-colors hover:border-edge-strong hover:text-ink"
            >
              <span aria-hidden="true" className="text-sm leading-none">
                ×
              </span>
            </button>
          </header>

          <TavernRoomChatMembers
            activeRoom={activeRoom}
            identityId={identity.id}
            state={state}
            presence={chatPresence}
            profileHref={profileHref}
            invitingMemberId={invitingMemberId}
            onInviteMember={inviteMember}
          />

          <TavernRoomChatMessages
            activeRoom={activeRoom}
            identityId={identity.id}
            presence={chatPresence}
            profileHref={profileHref}
            messagesRef={messagesRef}
            className="min-h-0 flex-1 overflow-y-auto"
          />

          <div className="border-t border-edge p-4">
            <TavernRoomChatComposer
              draft={draft}
              onDraftChange={setDraft}
              emojiOpen={emojiOpen}
              onEmojiOpenChange={setEmojiOpen}
              emojiRef={emojiRef}
              emojiRect={emojiRect}
              onEmojiRectChange={setEmojiRect}
              cooldownLeft={cooldownLeft}
              onSubmit={submitMessage}
              showPing={isPrivateTable(activeRoom)}
            />
          </div>
        </section>
        <CornerAccents />
      </div>
    </div>
  );
}
