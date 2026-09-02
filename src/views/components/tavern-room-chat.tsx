"use client";

import Link from "next/link";
import { type FormEvent, type RefObject } from "react";
import { isInPack } from "@/controllers/pack.controller";
import type { GameState } from "@/models/entities/game-state";
import type { PresenceStatus } from "@/models/entities/presence";
import type { TavernRoom } from "@/models/entities/tavern";
import { MAX_ROOM_MEMBERS, MESSAGE_MAX_LENGTH } from "@/models/entities/tavern";
import { CONTROL_HEIGHT } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
import { formatTime } from "@/shared/utils/format";
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
    <Link href={href} className={cn("transition-colors hover:text-highlight", className)}>
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

function ChatNick({
  href,
  name,
  className,
  status,
}: {
  href: string | null;
  name: string;
  className?: string;
  status?: PresenceStatus;
}) {
  return (
    <span className="mr-2 inline-flex items-center gap-2">
      {status ? (
        <Tooltip label={PRESENCE_LABELS[status]}>
          <PresenceDot size="small" status={status} />
        </Tooltip>
      ) : null}
      <MemberName href={href} name={name} className={className} />
      <span className="text-ink-faint">:</span>
    </span>
  );
}

export function TavernRoomChatMembers({
  activeRoom,
  identityId,
  state,
  presence,
  profileHref,
  invitingMemberId,
  onInviteMember,
}: {
  activeRoom: TavernRoom;
  identityId: string;
  state: GameState;
  presence: Record<string, PresenceStatus>;
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

          return (
            <li key={member.id} className="flex shrink-0 items-center gap-1 whitespace-nowrap">
              <Tag tone={yourself ? "neutral" : "faint"} className="gap-2">
                {status ? (
                  <Tooltip label={PRESENCE_LABELS[status]}>
                    <PresenceDot size="small" status={status} />
                  </Tooltip>
                ) : null}
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
  profileHref,
  messagesRef,
  className,
}: {
  activeRoom: TavernRoom;
  identityId: string;
  presence: Record<string, PresenceStatus>;
  profileHref: (memberId: string) => string | null;
  messagesRef: RefObject<HTMLUListElement | null>;
  className?: string;
}) {
  return (
    <List ref={messagesRef} className={className}>
      {activeRoom.messages.map((message, index) => (
        <ListRow key={message.id} className={cn(index % 2 === 1 && "bg-charcoal")}>
          <span className="font-mono text-[10px] text-ink-faint">{formatTime(message.at)}</span>
          <p className="min-w-0 flex-1 text-xs leading-relaxed">
            {message.authorId === "system" ? (
              <span className="mr-2 text-ink-faint">{message.authorName}:</span>
            ) : (
              <ChatNick
                href={profileHref(message.authorId)}
                name={message.authorName}
                className={cn(message.authorId === identityId ? "text-ink" : "text-ink-soft")}
                status={authorPresence(message.authorId, identityId, presence)}
              />
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
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <AiAuditNotice />
      <div className="flex items-center gap-2">
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
    </form>
  );
}

export function tavernRoomChatAction(activeRoom: TavernRoom): string {
  return activeRoom.members.length + " de " + (activeRoom.privateFor ? 2 : MAX_ROOM_MEMBERS);
}
