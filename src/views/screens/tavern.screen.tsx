"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { tavernChatStore } from "@/controllers/tavern-chat.store";
import { useIsDesktop } from "@/controllers/use-is-desktop";
import { useGame } from "@/controllers/game.context";
import { isInPack, listPack } from "@/controllers/pack.controller";
import { usePackPresence } from "@/controllers/use-pack-presence";
import { useTavernDoing } from "@/controllers/use-tavern-doing";
import { playSound } from "@/controllers/sound";
import { dismissTavernNotices } from "@/controllers/tavern-notify";
import { useTavern } from "@/controllers/use-tavern";
import { describeDoing, doingFor } from "@/models/entities/activity";
import { MAX_PACK, type PackInvite, type PackMate } from "@/models/entities/pack";
import type { PresenceStatus } from "@/models/entities/presence";
import {
  tavernReadRepository,
  type TavernReadMap,
} from "@/models/repositories/tavern-read.repository";
import {
  tavernSentRepository,
  type TavernSentMap,
} from "@/models/repositories/tavern-sent.repository";
import {
  MAX_ROOM_MEMBERS,
  MESSAGE_COOLDOWN_MS,
  OPEN_ROOM_MIN_LEVEL,
  ROOM_NAME_MAX_LENGTH,
  canOpenUnlockedRoom,
  roomMatchesSearch,
  roomTitle,
} from "@/models/entities/tavern";
import { isVip } from "@/models/rules/vip";
import { nickColorClass } from "@/models/rules/tavern-nicks";
import { NAME_MAX_LENGTH } from "@/shared/constants/game";
import { cn } from "@/shared/utils/class-names";
import { sanitizeName, sanitizeRoomSearch } from "@/shared/utils/text";
import { clampPage, pageCount, pageOf } from "@/shared/utils/pagination";
import { ActionIcon } from "../components/app-icon";
import { AiAuditNotice } from "../components/ai-audit-notice";
import { Button } from "../components/button";
import { Card, CardBody, CardFooter, CardHeader } from "../components/card";
import { Chip } from "../components/chip";
import { TavernRoomNumber } from "../components/tavern-room-number";
import { ConfirmDialog } from "../components/confirm-dialog";
import { Field } from "../components/field";
import { Modal } from "../components/modal";
import { Tag } from "../components/tag";
import { List, ListRow } from "../components/list";
import { Pagination } from "../components/pagination";
import { Panel } from "../components/panel";
import { EmptyState } from "../components/empty-state";
import { FilteredEmptyState } from "../components/filtered-empty-state";
import { Tooltip } from "../components/tooltip";
import { PageHeader } from "../layout/page-header";
import { PRESENCE_LABELS, PresenceDot } from "../components/presence-dot";
import {
  TavernRoomChatComposer,
  TavernRoomChatMembers,
  TavernRoomChatMessages,
  tavernRoomChatAction,
} from "../components/tavern-room-chat";

const PAGE_SIZE = 6;

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

export function TavernScreen() {
  const isDesktop = useIsDesktop();
  const {
    state,
    character,
    notify,
    invite,
    inviteByNick,
    acceptInvite,
    declineInvite,
    fetchInvites,
    removeFromPack,
    activity,
  } = useGame();

  const chat = useSyncExternalStore(
    tavernChatStore.subscribe,
    tavernChatStore.snapshot,
    tavernChatStore.serverSnapshot,
  );
  const [roomName, setRoomName] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [hideName, setHideName] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [joinPasswords, setJoinPasswords] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [roomSearch, setRoomSearch] = useState("");
  const [nick, setNick] = useState("");
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<PackMate | null>(null);
  const [invites, setInvites] = useState<PackInvite[]>([]);
  const [draft, setDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiRect, setEmojiRect] = useState<DOMRect | null>(null);
  const [invitingMemberId, setInvitingMemberId] = useState<string | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [sentBeat, setSentBeat] = useState(0);

  const emojiRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLUListElement>(null);
  const sentMapRef = useRef<TavernSentMap>({});
  const openRoomId = chat.open ? chat.roomId : null;
  const [layoutReady, setLayoutReady] = useState(false);
  useEffect(() => {
    setLayoutReady(true);
  }, []);
  const mobileChat = layoutReady && !isDesktop;

  const {
    identity,
    rooms,
    ready,
    activeRoom,
    createRoom,
    joinRoom,
    leaveRoom,
    closeRoom,
    openDirect,
    sendMessage,
    announceAway,
  } = useTavern(mobileChat ? openRoomId : null);
  const [closingRoomId, setClosingRoomId] = useState<string | null>(null);

  const fetchInvitesRef = useRef(fetchInvites);
  useEffect(() => {
    fetchInvitesRef.current = fetchInvites;
  });
  const refreshInvites = useCallback(() => {
    void fetchInvitesRef.current().then((list) => {
      if (list) setInvites(list);
    });
  }, []);
  useEffect(() => {
    refreshInvites();
    const timer = window.setInterval(refreshInvites, 10000);
    return () => window.clearInterval(timer);
  }, [refreshInvites]);

  const [readMap, setReadMap] = useState<TavernReadMap>(() => tavernReadRepository.load());
  const roomsRef = useRef(rooms);
  useEffect(() => {
    roomsRef.current = rooms;
  });

  const selfId = identity?.id ?? "";
  const unreadByRoom = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { room } of rooms) {
      const lastRead = readMap[room.id] ?? "";
      counts.set(
        room.id,
        room.messages.filter(
          (message) =>
            message.at > lastRead &&
            message.authorId !== "system" &&
            message.authorId !== selfId,
        ).length,
      );
    }
    return counts;
  }, [rooms, readMap, selfId]);
  const totalUnread = useMemo(
    () => [...unreadByRoom.values()].reduce((total, count) => total + count, 0),
    [unreadByRoom],
  );

  useEffect(() => {
    document.title = totalUnread > 0 ? "Wizold - Taverna [" + totalUnread + "]" : "Wizold - Taverna";
    return () => {
      document.title = "Wizold - Taverna";
    };
  }, [totalUnread]);

  const heardRef = useRef<string | null>(null);
  useEffect(() => {
    let latest = "";
    for (const { room, isPrivate } of rooms) {
      if (isPrivate) continue;
      for (const message of room.messages) {
        if (message.authorId === "system" || message.authorId === selfId) continue;
        if (message.at > latest) latest = message.at;
      }
    }
    if (!latest) return;
    if (heardRef.current === null) {
      heardRef.current = latest;
      return;
    }
    if (latest > heardRef.current) {
      heardRef.current = latest;
      if (document.hidden) playSound("chat");
    }
  }, [rooms, selfId]);

  const markRoomRead = useCallback((roomId: string) => {
    const summary = roomsRef.current.find((entry) => entry.room.id === roomId);
    if (summary) dismissTavernNotices(summary.room.name);
    const lastAt = summary?.room.messages[summary.room.messages.length - 1]?.at;
    if (!lastAt) return;
    const next = tavernReadRepository.mark(
      roomId,
      lastAt,
      roomsRef.current.map((entry) => entry.room.id),
    );
    if (next) setReadMap(next);
  }, []);

  useEffect(() => {
    dismissTavernNotices();
  }, []);

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

  const mobileLastMessageId = activeRoom?.messages[activeRoom.messages.length - 1]?.id ?? null;

  useEffect(() => {
    if (!mobileChat) return;
    const list = messagesRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [mobileChat, mobileLastMessageId]);

  const lastMineAt = useMemo(() => {
    if (!activeRoom) return null;
    for (let index = activeRoom.messages.length - 1; index >= 0; index -= 1) {
      if (activeRoom.messages[index].authorId === selfId) return activeRoom.messages[index].at;
    }
    return null;
  }, [activeRoom, selfId]);

  useEffect(() => {
    if (!mobileChat || !openRoomId) return;
    const compute = () => {
      const marker = sentMapRef.current[openRoomId];
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
  }, [mobileChat, lastMineAt, openRoomId, sentBeat]);

  const lastMessageAt = activeRoom?.messages[activeRoom.messages.length - 1]?.at ?? null;
  useEffect(() => {
    if (!mobileChat || !openRoomId || !lastMessageAt) return;
    const timer = window.setTimeout(() => markRoomRead(openRoomId), 0);
    return () => window.clearTimeout(timer);
  }, [mobileChat, openRoomId, lastMessageAt, markRoomRead]);

  useEffect(() => {
    if (!ready || !mobileChat || !openRoomId) return;
    const entry = rooms.find((summary) => summary.room.id === openRoomId);
    if (!entry?.isMember) tavernChatStore.closeWindow();
  }, [ready, mobileChat, openRoomId, rooms]);

  useEffect(() => {
    if (!mobileChat || !openRoomId) return;
    setDraft("");
    setEmojiOpen(false);
    setInvitingMemberId(null);
    setSentBeat(0);
    setCooldownLeft(0);
  }, [mobileChat, openRoomId]);

  useEffect(() => {
    setReadMap(tavernReadRepository.load());
  }, [rooms, chat.open, chat.roomId]);

  const filteredRooms = useMemo(() => {
    return rooms.filter(({ room, isMember }) => roomMatchesSearch(room, isMember, roomSearch));
  }, [rooms, roomSearch]);

  const pack = useMemo(() => listPack(state), [state]);
  const packIds = useMemo(() => pack.map((mate) => mate.id), [pack]);
  const packPresence = usePackPresence(packIds, Boolean(character));
  const tavernDoing = useTavernDoing(Boolean(character));
  const mineDoing = activity?.kind ?? null;
  const chatPresence = useMemo(() => {
    const next: Record<string, PresenceStatus> = {};
    for (const id of packIds) next[id] = packPresence[id] ?? "offline";
    return next;
  }, [packIds, packPresence]);

  if (!character || !identity) return null;

  const mayOpenUnlocked = canOpenUnlockedRoom({
    ...identity,
    vip: identity.vip ?? isVip(character, Date.now()),
  });

  const ownRoom =
    rooms.find(({ room, isPrivate }) => !isPrivate && room.ownerId === identity.id) ?? null;

  const openTables = rooms.filter(({ isPrivate }) => !isPrivate).length;

  const closingRoom = rooms.find(({ room }) => room.id === closingRoomId) ?? null;

  const profileHref = (memberId: string): string | null =>
    memberId === identity.id ? "/character" : "/ranking/" + memberId;

  const currentPage = clampPage(page, filteredRooms.length, PAGE_SIZE);
  const pages = pageCount(filteredRooms.length, PAGE_SIZE);
  const roomsOnPage = pageOf(filteredRooms, currentPage, PAGE_SIZE);

  function showChatRoom(roomId: string) {
    const previous = tavernChatStore.openRoom(roomId);
    if (previous) {
      markRoomRead(previous);
      void announceAway(previous);
    }
    markRoomRead(roomId);
  }

  async function open(roomId: string, password: string) {
    const result = await joinRoom(roomId, password);
    if (!result) return;
    notify(result.message, result.ok, "Taverna");
    if (result.ok) {
      playSound("door");
      showChatRoom(roomId);
      setJoinPasswords((current) => ({ ...current, [roomId]: "" }));
    }
  }

  async function leave(roomId: string) {
    const result = await leaveRoom(roomId);
    if (!result) return;

    notify(result.message, result.ok, "Taverna");
    if (result.ok) {
      playSound("door");
      markRoomRead(roomId);
      if (tavernChatStore.isOpenFor(roomId)) tavernChatStore.closeWindow();
    }
  }

  async function submitRoom(event: FormEvent) {
    event.preventDefault();
    if (creatingRoom) return;
    setCreatingRoom(true);
    try {
      const result = await createRoom(roomName, roomPassword, hideName);
      if (!result) return;
      if (!result.ok) notify(result.message, false, "Taverna");
      if (result.ok) {
        setRoomName("");
        setRoomPassword("");
        setHideName(false);
      }
    } finally {
      setCreatingRoom(false);
    }
  }

  async function submitNick(event: FormEvent) {
    event.preventDefault();
    if (inviting || nick.trim().length === 0 || pack.length >= MAX_PACK) return;
    setInviting(true);
    try {
      if (await inviteByNick(nick)) setNick("");
    } finally {
      setInviting(false);
    }
  }

  async function accept(id: string) {
    if (await acceptInvite(id)) refreshInvites();
  }

  async function decline(id: string) {
    if (await declineInvite(id)) refreshInvites();
  }

  async function speakTo(mate: PackMate) {
    const result = await openDirect({ id: mate.id, name: mate.name });
    if (!result) return;

    notify(result.message, result.ok, "Taverna");
    if (result.ok && result.roomId) {
      playSound("door");
      showChatRoom(result.roomId);
    }
  }

  function closeMobileChat() {
    if (!activeRoom) {
      tavernChatStore.closeWindow();
      return;
    }
    playSound("door");
    markRoomRead(activeRoom.id);
    void announceAway(activeRoom.id);
    tavernChatStore.closeWindow();
    setDraft("");
    setEmojiOpen(false);
  }

  async function submitMessage(event: FormEvent) {
    event.preventDefault();
    if (!openRoomId) return;
    const result = await sendMessage(openRoomId, draft);
    if (!result) return;
    if (result.ok) {
      sentMapRef.current = { ...sentMapRef.current, [openRoomId]: Date.now() };
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

  return (
    <>
      <PageHeader
        title="Taverna"
        description={
          "Mesas de conversa para até " +
          MAX_ROOM_MEMBERS +
          " pessoas, com ou sem senha. A mesa fecha sozinha quando a última pessoa sai."
        }
        action={
          <Tag tone="neutral">
            {openTables === 1 ? "1 mesa aberta" : openTables + " mesas abertas"}
          </Tag>
        }
      />

      <Panel
        title="Alcance desta taverna"
        description="Leia antes de combinar encontro com alguém."
      >
        <p className="text-xs leading-relaxed text-ink-soft">
          As mesas vivem no servidor: quem estiver jogando, de qualquer máquina, senta nas mesmas
          mesas e lê as mesmas falas. A senha de mesa é uma combinação entre jogadores, guardada
          cifrada; ainda assim, invente uma só para a mesa, nunca uma senha que você usa em outro
          lugar.
        </p>
      </Panel>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Panel
            title="Escolher mesa"
            description={
              ownRoom
                ? "Você já tem uma mesa aberta: feche a sua para abrir outra."
                : "Sem senha, NV " +
                  OPEN_ROOM_MIN_LEVEL +
                  "+ ou VIP. Com senha, qualquer nível. Mesa reservada sempre com senha."
            }
          >
            <form onSubmit={submitRoom} className="space-y-3">
              <Field
                label="Nome da mesa"
                value={roomName}
                maxLength={ROOM_NAME_MAX_LENGTH}
                placeholder="Mesa do canto"
                autoComplete="off"
                disabled={Boolean(ownRoom)}
                onChange={(event) =>
                  setRoomName(sanitizeName(event.target.value, ROOM_NAME_MAX_LENGTH))
                }
              />
              <AiAuditNotice />
              <Field
                label={hideName ? "Senha" : "Senha (opcional)"}
                type="password"
                maxLength={60}
                value={roomPassword}
                placeholder={
                  hideName ? "obrigatória na mesa reservada" : "deixe vazio para mesa aberta"
                }
                autoComplete="new-password"
                disabled={Boolean(ownRoom)}
                onChange={(event) => setRoomPassword(event.target.value)}
              />
              <Chip
                active={hideName}
                disabled={Boolean(ownRoom)}
                onClick={() => setHideName((current) => !current)}
              >
                Mesa reservada
              </Chip>
              {hideName ? (
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  De fora só aparece o número. A senha é obrigatória.
                </p>
              ) : null}
              <Tooltip
                block
                label={
                  ownRoom
                    ? "Feche a sua mesa antes de abrir outra"
                    : hideName && roomPassword.trim().length === 0
                      ? "Mesa reservada precisa de senha."
                      : roomPassword.trim().length === 0 && !mayOpenUnlocked
                        ? "Mesa sem senha é só a partir do NV " +
                          OPEN_ROOM_MIN_LEVEL +
                          ", ou com VIP. Ponha uma senha para abrir em qualquer nível."
                        : ""
                }
              >
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  busy={creatingRoom}
                  disabled={
                    creatingRoom ||
                    Boolean(ownRoom) ||
                    roomName.trim().length === 0 ||
                    (hideName && roomPassword.trim().length === 0) ||
                    (roomPassword.trim().length === 0 && !mayOpenUnlocked)
                  }
                >
                  {ownRoom ? "Sua mesa: " + roomTitle(ownRoom.room, true) : "Escolher mesa"}
                </Button>
              </Tooltip>
            </form>
          </Panel>

          {invites.length > 0 ? (
            <Panel
              title="Convites"
              description="Quem chamou você para a matilha. Aceitar torna vocês companheiros e libera a mesa reservada."
              action={<Tag tone="light">{invites.length}</Tag>}
              padding="none"
            >
              <List>
                {invites.map((entry) => (
                  <ListRow key={entry.id}>
                    <p className="min-w-0 flex-1 truncate text-sm text-ink">
                      <MemberName href={profileHref(entry.fromId)} name={entry.fromName} />
                    </p>
                    <Tooltip label={"Aceitar " + entry.fromName}>
                      <Button
                        icon
                        variant="secondary"
                        aria-label={"Aceitar " + entry.fromName}
                        onClick={() => accept(entry.id)}
                      >
                        <ActionIcon action="keep" />
                      </Button>
                    </Tooltip>
                    <Tooltip label={"Recusar " + entry.fromName}>
                      <Button
                        icon
                        variant="ghost"
                        aria-label={"Recusar " + entry.fromName}
                        onClick={() => decline(entry.id)}
                      >
                        <ActionIcon action="remove" />
                      </Button>
                    </Tooltip>
                  </ListRow>
                ))}
              </List>
            </Panel>
          ) : null}

          <Panel
            title="Matilha"
            description="Companheiros de matilha. Chamar um abre uma mesa reservada só de vocês dois."
            action={
              <Tag tone="neutral">
                {pack.length} de {MAX_PACK}
              </Tag>
            }
            padding="none"
          >
            <form onSubmit={submitNick} className="space-y-3 border-b border-edge p-4">
              <Field
                label="Convidar pelo nick"
                value={nick}
                maxLength={NAME_MAX_LENGTH}
                placeholder="O nick de quem você procura"
                autoComplete="off"
                hint="Quem está numa mesa agora responde primeiro, depois o quadro do ranking."
                onChange={(event) => setNick(sanitizeName(event.target.value, NAME_MAX_LENGTH))}
              />
              <AiAuditNotice />
              <Tooltip block label={pack.length >= MAX_PACK ? "A matilha está cheia" : ""}>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  busy={inviting}
                  disabled={nick.trim().length === 0 || pack.length >= MAX_PACK || inviting}
                >
                  Convidar para a matilha
                </Button>
              </Tooltip>
            </form>

            {pack.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Matilha vazia"
                  description="Convide alguém de dentro de uma mesa ou pelo nick: a matilha começa quando aceitarem."
                />
              </div>
            ) : (
              <List>
                {pack.map((mate) => (
                  <ListRow key={mate.id}>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <Tooltip
                        label={PRESENCE_LABELS[packPresence[mate.id] ?? "offline"]}
                      >
                        <PresenceDot status={packPresence[mate.id] ?? "offline"} />
                      </Tooltip>
                      <p className="min-w-0 flex-1 truncate text-sm text-ink">
                        <Tooltip
                          label={describeDoing(
                            mate.name,
                            doingFor(mate.id, identity.id, mineDoing, tavernDoing),
                          )}
                        >
                          <MemberName href={profileHref(mate.id)} name={mate.name} />
                        </Tooltip>
                      </p>
                    </div>

                    <Tooltip label={"Falar com " + mate.name}>
                      <Button
                        icon
                        variant="secondary"
                        aria-label={"Falar com " + mate.name}
                        onClick={() => speakTo(mate)}
                      >
                        <ActionIcon action="message" />
                      </Button>
                    </Tooltip>
                    <Tooltip label={"Sair da matilha com " + mate.name}>
                      <Button
                        icon
                        variant="ghost"
                        aria-label={"Sair da matilha com " + mate.name}
                        onClick={() => setRemoving(mate)}
                      >
                        <ActionIcon action="remove" />
                      </Button>
                    </Tooltip>
                  </ListRow>
                ))}
              </List>
            )}
          </Panel>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {rooms.length === 0 ? (
            <EmptyState
              title="Nenhuma mesa aberta"
              description="Abra a primeira e espere alguém puxar a cadeira."
            />
          ) : (
            <>
              <Field
                accent
                aria-label="Buscar mesa pelo nome ou número"
                placeholder="Buscar mesa pelo nome ou #"
                value={roomSearch}
                maxLength={ROOM_NAME_MAX_LENGTH}
                autoComplete="off"
                onChange={(event) => {
                  setRoomSearch(sanitizeRoomSearch(event.target.value, ROOM_NAME_MAX_LENGTH));
                  setPage(1);
                }}
              />

              {filteredRooms.length === 0 ? (
                <FilteredEmptyState description="Nenhuma mesa combina com essa busca." />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {roomsOnPage.map(({ room, locked, full, memberCount, isMember, isPrivate }) => {
                      const unread = unreadByRoom.get(room.id) ?? 0;
                      const seatedHere = openRoomId === room.id;

                      return (
                <Card
                  key={room.id}
                  height="fill"
                  interactive={!full || isMember}
                  tone={isPrivate || room.ownerId === identity.id ? "highlighted" : "default"}
                >
                  <CardHeader>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <TavernRoomNumber number={room.number} className="text-sm" />
                          {isMember || !room.nameHidden ? (
                            <h3 className="min-w-0 truncate text-sm text-ink">{room.name}</h3>
                          ) : (
                            <h3 className="min-w-0 truncate text-sm text-ink-faint">Reservada</h3>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {unread > 0 ? (
                            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-ember bg-ember px-2 font-mono text-[10px] font-bold tracking-normal text-base">
                              {unread > 9 ? "9+" : unread}
                            </span>
                          ) : null}
                          {isPrivate ? (
                            <Tag tone="neutral">Reservada</Tag>
                          ) : (
                            <>
                              {room.ownerId === identity.id ? (
                                <Tag tone="neutral">Sua mesa</Tag>
                              ) : null}
                              {room.nameHidden ? <Tag tone="neutral">Reservada</Tag> : null}
                              <Tag tone={locked ? "neutral" : "faint"}>
                                {locked ? "Com senha" : "Aberta"}
                              </Tag>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                        {isPrivate
                          ? "Mesa para dois"
                          : memberCount + " de " + MAX_ROOM_MEMBERS + " pessoas"}
                      </p>
                    </div>
                  </CardHeader>

                  <CardBody>
                    <ul className="flex grow items-center gap-3 overflow-x-auto pb-1">
                      {room.members.map((member) => (
                        <li key={member.id} className="shrink-0 whitespace-nowrap text-xs">
                          <Tooltip
                            label={describeDoing(
                              member.name,
                              doingFor(member.id, identity.id, mineDoing, tavernDoing),
                            )}
                          >
                            <MemberName
                              href={profileHref(member.id)}
                              name={member.name}
                              className={nickColorClass(member.nickColor)}
                            />
                          </Tooltip>
                          {!isPrivate && member.id === room.ownerId ? (
                            <span className="ml-1 text-ink-faint">(dono)</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>

                    {locked && !isMember ? (
                      <Field
                        type="password"
                        maxLength={60}
                        aria-label={"Senha da mesa " + roomTitle(room, isMember)}
                        placeholder="senha da mesa"
                        value={joinPasswords[room.id] ?? ""}
                        onChange={(event) =>
                          setJoinPasswords((current) => ({
                            ...current,
                            [room.id]: event.target.value,
                          }))
                        }
                        onKeyDown={(event) => {
                          if (event.key !== "Enter") return;
                          event.preventDefault();
                          open(room.id, joinPasswords[room.id] ?? "");
                        }}
                      />
                    ) : null}
                  </CardBody>

                  <CardFooter>
                    <span className="text-[11px] text-ink-faint">
                      {isPrivate
                        ? "Só vocês dois"
                        : full && !isMember
                          ? "Mesa cheia"
                          : isMember
                            ? "Seu lugar está guardado"
                            : "Livre"}
                    </span>
                    <div className="flex items-center gap-2">
                      {isPrivate || room.ownerId === identity.id ? (
                        <Button variant="ghost" onClick={() => setClosingRoomId(room.id)}>
                          Fechar mesa
                        </Button>
                      ) : isMember ? (
                        <Button variant="ghost" onClick={() => leave(room.id)}>
                          Sair
                        </Button>
                      ) : null}
                      <Tooltip
                        label={
                          seatedHere
                            ? "Você já está sentado nesta mesa"
                            : full && !isMember
                              ? "A mesa está cheia: " + MAX_ROOM_MEMBERS + " pessoas"
                              : ""
                        }
                      >
                        <Button
                          variant={seatedHere ? "secondary" : "primary"}
                          disabled={seatedHere || (full && !isMember)}
                          onClick={() => open(room.id, joinPasswords[room.id] ?? "")}
                        >
                          {seatedHere ? "Se sentou" : "Sentar"}
                        </Button>
                      </Tooltip>
                    </div>
                  </CardFooter>
                </Card>
                );
              })}
                  </div>

                  <Pagination page={currentPage} pages={pages} onChange={setPage} />
                </>
              )}
            </>
          )}
        </div>
      </div>

      {mobileChat ? (
        <Modal
          open={Boolean(activeRoom)}
          title={activeRoom ? activeRoom.name : ""}
          leading={
            activeRoom ? (
              <TavernRoomNumber number={activeRoom.number} className="text-[11px]" />
            ) : null
          }
          action={activeRoom ? tavernRoomChatAction(activeRoom) : null}
          onClose={closeMobileChat}
          className="max-w-lg"
          footer={
            activeRoom ? (
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
              />
            ) : null
          }
        >
          {activeRoom && identity ? (
            <>
              <TavernRoomChatMembers
                activeRoom={activeRoom}
                identityId={identity.id}
                state={state}
                presence={chatPresence}
                doing={tavernDoing}
                mine={mineDoing}
                profileHref={profileHref}
                invitingMemberId={invitingMemberId}
                onInviteMember={inviteMember}
              />
              <TavernRoomChatMessages
                activeRoom={activeRoom}
                identityId={identity.id}
                presence={chatPresence}
                doing={tavernDoing}
                mine={mineDoing}
                profileHref={profileHref}
                messagesRef={messagesRef}
                className="h-[min(20rem,45svh)] overflow-y-auto"
              />
            </>
          ) : null}
        </Modal>
      ) : null}

      <ConfirmDialog
        open={closingRoomId !== null}
        title={closingRoom?.isPrivate ? "Fechar mesa reservada" : "Fechar mesa"}
        description={
          closingRoom?.isPrivate
            ? "A mesa some para vocês dois e as mensagens se perdem. Chamar de novo abre outra, vazia."
            : "A mesa sai do quadro para todo mundo e a conversa se perde. Abrir outra depois é de graça."
        }
        detail={closingRoom ? roomTitle(closingRoom.room, true) : undefined}
        confirmLabel="Fechar"
        onCancel={() => setClosingRoomId(null)}
        onConfirm={async () => {
          const roomId = closingRoomId;
          if (!roomId) return;
          const result = await closeRoom(roomId);
          if (result) notify(result.message, result.ok, "Taverna");
          if (result?.ok) {
            playSound("door");
            if (tavernChatStore.isOpenFor(roomId)) tavernChatStore.closeWindow();
          }
          setClosingRoomId(null);
        }}
      />

      <ConfirmDialog
        open={removing !== null}
        title="Sair da matilha"
        description="Vocês dois saem da matilha um do outro. Sem o laço não dá para abrir novas mesas reservadas entre vocês; convidar de novo recomeça."
        detail={removing?.name}
        confirmLabel="Sair"
        onCancel={() => setRemoving(null)}
        onConfirm={async () => {
          if (removing) await removeFromPack(removing.id);
          setRemoving(null);
        }}
      />
    </>
  );
}
