"use client";

import Link from "next/link";
import { type FormEvent, type RefObject, useSyncExternalStore } from "react";
import { playSoundPreview } from "@/controllers/sound";
import { tavernPingRepository } from "@/models/repositories/tavern-ping.repository";
import { isInPack } from "@/controllers/pack.controller";
import { describeDoing, doingFor, type HunterDoing, type ActivityKind } from "@/models/entities/activity";
import type { GameState } from "@/models/entities/game-state";
import type { PresenceStatus } from "@/models/entities/presence";
import type { TavernRoom } from "@/models/entities/tavern";
import { MAX_ROOM_MEMBERS, MESSAGE_MAX_LENGTH } from "@/models/entities/tavern";
import { nickColorClass, nickColorOf } from "@/models/rules/tavern-nicks";
import { CONTROL_HEIGHT } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
import { formatTime } from "@/shared/utils/format";
import { splitChatLinks } from "@/shared/utils/text";
import { ActionIcon } from "./app-icon";
import { AiAuditNotice } from "./ai-audit-notice";
import { Button } from "./button";
import { Field } from "./field";
import { List, ListRow } from "./list";
import { PRESENCE_LABELS, PresenceDot } from "./presence-dot";
import { Tag } from "./tag";
import { Tooltip } from "./tooltip";

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
    <Link
      href={href}
      className={cn("underline-offset-2 transition-colors hover:underline", className)}
    >
      {name}
    </Link>
  );
}

function authorPresence(
  authorId: string,
  identityId: string,
  presence: Record<string, PresenceStatus>,
): PresenceStatus | undefined {
  if (authorId === identityId) return "active";
  return presence[authorId];
}

function ChatText({ text }: { text: string }) {
  return (
    <>
      {splitChatLinks(text).map((part, index) =>
        part.kind === "link" ? (
          <a
            key={index}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            className="break-words underline underline-offset-2 transition-colors hover:text-highlight"
          >
            {part.value}
          </a>
        ) : (
          <span key={index}>{part.value}</span>
        ),
      )}
    </>
  );
}

function ChatNick({
  at,
  href,
  name,
  className,
  status,
  doing,
}: {
  at: string;
  href: string | null;
  name: string;
  className?: string;
  status?: PresenceStatus;
  doing: HunterDoing;
}) {
  return (
    <span className="mr-2 inline-flex items-center gap-2">
      <span className="font-mono text-[10px] text-ink-faint">{formatTime(at)}</span>
      {status ? (
        <Tooltip label={PRESENCE_LABELS[status]}>
          <PresenceDot size="small" status={status} />
        </Tooltip>
      ) : null}
      <Tooltip label={describeDoing(name, doing)}>
        <MemberName href={href} name={name} className={className} />
      </Tooltip>
      <span className="text-ink-faint">:</span>
    </span>
  );
}

export function TavernRoomChatMembers({
  activeRoom,
  identityId,
  state,
  presence,
  doing,
  mine,
  profileHref,
  invitingMemberId,
  onInviteMember,
}: {
  activeRoom: TavernRoom;
  identityId: string;
  state: GameState;
  presence: Record<string, PresenceStatus>;
  doing: Record<string, HunterDoing>;
  mine: ActivityKind | null;
  profileHref: (memberId: string) => string | null;
  invitingMemberId: string | null;
  onInviteMember: (member: { id: string; name: string }) => void;
}) {
  return (
    <div className="border-b border-edge px-4 py-3">
      <ul
        aria-label="Na mesa"
        className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1"
      >
        {activeRoom.members.map((member) => {
          const yourself = member.id === identityId;
          const kept = isInPack(state, member.id);
          const status = authorPresence(member.id, identityId, presence);
          const job = doingFor(member.id, identityId, mine, doing);

          return (
            <li key={member.id} className="flex shrink-0 items-center gap-1 whitespace-nowrap">
              <Tag tone={yourself ? "neutral" : "faint"} className="gap-2">
                {status ? (
                  <Tooltip label={PRESENCE_LABELS[status]}>
                    <PresenceDot size="small" status={status} />
                  </Tooltip>
                ) : null}
                <Tooltip label={describeDoing(member.name, job)}>
                  <MemberName
                    href={profileHref(member.id)}
                    name={member.name}
                    className={nickColorClass(member.nickColor)}
                  />
                </Tooltip>
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
                    onClick={() => onInviteMember(member)}
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
  );
}

export function TavernRoomChatMessages({
  activeRoom,
  identityId,
  presence,
  doing,
  mine,
  profileHref,
  messagesRef,
  className,
}: {
  activeRoom: TavernRoom;
  identityId: string;
  presence: Record<string, PresenceStatus>;
  doing: Record<string, HunterDoing>;
  mine: ActivityKind | null;
  profileHref: (memberId: string) => string | null;
  messagesRef: RefObject<HTMLUListElement | null>;
  className?: string;
}) {
  return (
    <List ref={messagesRef} className={className}>
      {activeRoom.messages.map((message, index) => (
        <ListRow key={message.id} className={cn(index % 2 === 1 && "bg-charcoal")}>
          <p className="min-w-0 flex-1 break-words text-xs leading-relaxed">
            {message.authorId === "system" ? (
              <span className="mr-2 inline-flex items-center gap-2">
                <span className="font-mono text-[10px] text-ink-faint">{formatTime(message.at)}</span>
                <span className="text-ink-faint">{message.authorName}:</span>
              </span>
            ) : (
              <ChatNick
                at={message.at}
                href={profileHref(message.authorId)}
                name={message.authorName}
                className={nickColorClass(nickColorOf(activeRoom, message.authorId))}
                status={authorPresence(message.authorId, identityId, presence)}
                doing={doingFor(message.authorId, identityId, mine, doing)}
              />
            )}
            <span
              className={cn(message.authorId === "system" ? "text-ink-faint" : "text-ink-soft")}
            >
              <ChatText text={message.text} />
            </span>
          </p>
        </ListRow>
      ))}
    </List>
  );
}

const EMOJIS = [
  "😂",
  "❤️",
  "👍",
  "😮",
  "😢",
  "🔥",
  "🎉",
  "🍺",
  "🐺",
  "🌕",
  "🌙",
  "⭐",
  "🍻",
  "⚔️",
  "🏆",
  "💀",
];

export function TavernRoomChatComposer({
  draft,
  onDraftChange,
  emojiOpen,
  onEmojiOpenChange,
  emojiRef,
  emojiRect,
  onEmojiRectChange,
  cooldownLeft,
  onSubmit,
}: {
  draft: string;
  onDraftChange: (value: string) => void;
  emojiOpen: boolean;
  onEmojiOpenChange: (open: boolean) => void;
  emojiRef: RefObject<HTMLDivElement | null>;
  emojiRect: DOMRect | null;
  onEmojiRectChange: (rect: DOMRect | null) => void;
  cooldownLeft: number;
  onSubmit: (event: FormEvent) => void;
}) {
  const pingOn = useSyncExternalStore(
    tavernPingRepository.subscribe,
    tavernPingRepository.enabled,
    tavernPingRepository.serverSnapshot,
  );

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex items-center gap-2">
        <Tooltip label={pingOn ? "Mutar notificação" : "Ativar notificação"}>
          <Button
            type="button"
            icon
            variant="outline"
            aria-label={pingOn ? "Mutar notificação da mesa" : "Ativar notificação da mesa"}
            aria-pressed={pingOn}
            onClick={() => {
              const next = !pingOn;
              tavernPingRepository.setEnabled(next);
              if (next) playSoundPreview("ping");
            }}
          >
            <ActionIcon action={pingOn ? "sound" : "mute"} />
          </Button>
        </Tooltip>
        <div className="relative min-w-0 flex-1">
          <Field
            aria-label="Mensagem"
            placeholder="Diga alguma coisa"
            maxLength={MESSAGE_MAX_LENGTH}
            autoComplete="off"
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
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
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  aria-label={"Inserir " + emoji}
                  onClick={() =>
                    onDraftChange(
                      draft.length + emoji.length <= MESSAGE_MAX_LENGTH ? draft + emoji : draft,
                    )
                  }
                  className={
                    "grid " + CONTROL_HEIGHT + " w-8 place-items-center rounded-md text-lg hover:bg-surface-high"
                  }
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : null}
          <Button
            type="button"
            icon
            variant="outline"
            aria-label="Emojis"
            aria-expanded={emojiOpen}
            onClick={() => {
              if (!emojiOpen) onEmojiRectChange(emojiRef.current?.getBoundingClientRect() ?? null);
              onEmojiOpenChange(!emojiOpen);
            }}
          >
            <ActionIcon action="smile" />
          </Button>
        </div>
        <Button type="submit" variant="primary" disabled={draft.trim().length === 0 || cooldownLeft > 0}>
          {cooldownLeft > 0 ? Math.ceil(cooldownLeft / 1000) : "Falar"}
        </Button>
      </div>
      <AiAuditNotice />
    </form>
  );
}

export function tavernRoomChatAction(activeRoom: TavernRoom): string {
  return activeRoom.members.length + " de " + (activeRoom.privateFor ? 2 : MAX_ROOM_MEMBERS);
}
