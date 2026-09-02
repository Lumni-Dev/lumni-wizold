"use client";

import Link from "next/link";
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
import { isInPack } from "@/controllers/pack.controller";
import { playSound } from "@/controllers/sound";
import { dismissTavernNotices } from "@/controllers/tavern-notify";
import { useGame } from "@/controllers/game.context";
import { useTavern } from "@/controllers/use-tavern";
import {
  tavernReadRepository,
} from "@/models/repositories/tavern-read.repository";
import {
  tavernSentRepository,
  type TavernSentMap,
} from "@/models/repositories/tavern-sent.repository";
import {
  MAX_ROOM_MEMBERS,
  MESSAGE_COOLDOWN_MS,
  MESSAGE_MAX_LENGTH,
} from "@/models/entities/tavern";
import { CONTROL_HEIGHT } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
import { formatTime } from "@/shared/utils/format";
import { ActionIcon } from "./app-icon";
import { AiAuditNotice } from "./ai-audit-notice";
import { Button } from "./button";
import { CornerAccents } from "./corner-accents";
import { Field } from "./field";
import { List, ListRow } from "./list";
import { Tag } from "./tag";
import { Tooltip } from "./tooltip";
import { Move } from "lucide-react";

function MemberName({
  href,
  name,
  className,
}: {
  href: string | null;
  name: string;
  className?: string;
}) {
  if (!href) return <span className={className}>{name}</span>;
  return (
    <Link href={href} className={cn("transition-colors hover:text-highlight", className)}>
      {name}
    </Link>
  );
}

function clampPosition(x: number, y: number, width: number, height: number) {
  const maxX = Math.max(16, window.innerWidth - width - 16);
  const maxY = Math.max(16, window.innerHeight - height - 16);
  return {
    x: Math.min(Math.max(16, x), maxX),
    y: Math.min(Math.max(16, y), maxY),
  };
}

export function TavernChatWindow() {
  const chat = useSyncExternalStore(
    tavernChatStore.subscribe,
    tavernChatStore.snapshot,
    tavernChatStore.serverSnapshot,
  );
  const { state, notify, invite } = useGame();
  const { identity, rooms, activeRoom, sendMessage, announceAway } = useTavern(
    chat.open ? chat.roomId : null,
  );

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
    if (chat.open && chat.roomId && !activeRoom) tavernChatStore.closeWindow();
  }, [chat.open, chat.roomId, activeRoom]);

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

  if (!chat.open || !chat.roomId || !activeRoom || !identity) return null;

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

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>) {
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
      className="pointer-events-auto fixed z-60 flex w-[min(32rem,calc(100vw-2rem))] flex-col items-center"
      style={{ left: chat.x, top: chat.y }}
    >
      <div className="relative w-full">
        <section
          role="dialog"
          aria-label={activeRoom.name}
          className="flex max-h-[min(32rem,calc(100svh-6rem))] w-full flex-col overflow-hidden rounded-lg border border-edge-strong bg-surface shadow-[0_24px_60px_-20px_rgba(0,0,0,0.95)]"
        >
        <header className="flex items-center gap-3 border-b border-edge bg-surface-high px-4 py-3">
          <h2 className="heading min-w-0 flex-1 truncate text-[11px] text-ink">{activeRoom.name}</h2>
          <span className="shrink-0 font-mono text-[11px] text-ink-faint">
            {activeRoom.members.length} de {activeRoom.privateFor ? 2 : MAX_ROOM_MEMBERS}
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

        <div className="border-b border-edge px-4 py-3">
          <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-ink-faint">Na mesa</p>
          <ul className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
            {activeRoom.members.map((member) => {
              const yourself = member.id === identity.id;
              const kept = isInPack(state, member.id);

              return (
                <li key={member.id} className="flex shrink-0 items-center gap-1 whitespace-nowrap">
                  <Tag tone={yourself ? "neutral" : "faint"} className="gap-2">
                    <MemberName href={profileHref(member.id)} name={member.name} />
                    {kept && !yourself ? <span className="text-ink-faint">- na matilha</span> : null}
                  </Tag>
                  {!yourself && !kept ? (
                    <Tooltip label={"Convidar " + member.name + " para a matilha"}>
                      <Button
                        icon
                        variant="secondary"
                        busy={invitingMemberId === member.id}
                        disabled={invitingMemberId !== null && invitingMemberId !== member.id}
                        aria-label={"Convidar " + member.name + " para a matilha"}
                        onClick={() => inviteMember(member)}
                      >
                        <ActionIcon action="keep" />
                      </Button>
                    </Tooltip>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        <List ref={messagesRef} className="min-h-0 flex-1 overflow-y-auto">
          {activeRoom.messages.map((message, index) => (
            <ListRow key={message.id} className={cn(index % 2 === 1 && "bg-charcoal")}>
              <span className="font-mono text-[10px] text-ink-faint">{formatTime(message.at)}</span>
              <p className="min-w-0 flex-1 text-xs leading-relaxed">
                {message.authorId === "system" ? (
                  <span className="mr-2 text-ink-faint">{message.authorName}:</span>
                ) : (
                  <>
                    <MemberName
                      href={profileHref(message.authorId)}
                      name={message.authorName}
                      className={cn(message.authorId === identity.id ? "text-ink" : "text-ink-soft")}
                    />
                    <span className="mr-2 text-ink-faint">:</span>
                  </>
                )}
                <span
                  className={cn(message.authorId === "system" ? "text-ink-faint" : "text-ink-soft")}
                >
                  {message.text}
                </span>
              </p>
            </ListRow>
          ))}
        </List>

        <div className="border-t border-edge p-4">
          <form onSubmit={submitMessage} className="space-y-2">
            <AiAuditNotice />
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Field
                  aria-label="Mensagem"
                  placeholder="Diga alguma coisa"
                  maxLength={MESSAGE_MAX_LENGTH}
                  autoComplete="off"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className="pr-14"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-ink-faint">
                  {draft.length}/{MESSAGE_MAX_LENGTH}
                </span>
              </div>
              <div className="relative shrink-0" ref={emojiRef}>
                {emojiOpen ? (
                  <div
                    className="fixed z-[61] grid grid-cols-4 gap-1 rounded-md border border-edge-strong bg-surface p-2 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.9)]"
                    style={
                      emojiRect
                        ? {
                            bottom: window.innerHeight - emojiRect.top + 8,
                            right: window.innerWidth - emojiRect.right,
                          }
                        : undefined
                    }
                  >
                    {["😂", "❤️", "👍", "😮", "😢", "🔥", "🎉", "🍺", "🐺", "🌕", "🌙", "⭐", "🍻", "⚔️", "🏆", "💀"].map(
                      (emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          aria-label={"Inserir " + emoji}
                          onClick={() =>
                            setDraft((current) =>
                              current.length + emoji.length <= MESSAGE_MAX_LENGTH
                                ? current + emoji
                                : current,
                            )
                          }
                          className={
                            "grid " + CONTROL_HEIGHT + " w-8 place-items-center rounded-md text-lg hover:bg-surface-high"
                          }
                        >
                          {emoji}
                        </button>
                      ),
                    )}
                  </div>
                ) : null}
                <Button
                  type="button"
                  icon
                  variant="outline"
                  aria-label="Emojis"
                  aria-expanded={emojiOpen}
                  onClick={() => {
                    if (!emojiOpen) setEmojiRect(emojiRef.current?.getBoundingClientRect() ?? null);
                    setEmojiOpen((open) => !open);
                  }}
                >
                  <ActionIcon action="smile" />
                </Button>
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={draft.trim().length === 0 || cooldownLeft > 0}
              >
                {cooldownLeft > 0 ? Math.ceil(cooldownLeft / 1000) : "Falar"}
              </Button>
            </div>
          </form>
        </div>
        </section>
        <CornerAccents />
      </div>

      <button
        type="button"
        aria-label="Mover janela do chat"
        onPointerDown={startDrag}
        className="mt-2 flex h-8 w-8 cursor-grab items-center justify-center rounded-full border border-edge-strong bg-surface-high text-ink-faint shadow-[0_8px_24px_-8px_rgba(0,0,0,0.9)] transition-colors hover:border-edge-strong hover:bg-surface-top hover:text-ink active:cursor-grabbing"
      >
        <Move className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
