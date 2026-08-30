"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useGame } from "@/controllers/game.context";
import { isInPack, listPack } from "@/controllers/pack.controller";
import { playSound } from "@/controllers/sound";
import { useTavern } from "@/controllers/use-tavern";
import { MAX_PACK, type PackInvite, type PackMate } from "@/models/entities/pack";
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
  MESSAGE_MAX_LENGTH,
  OPEN_ROOM_MIN_LEVEL,
  ROOM_NAME_MAX_LENGTH,
} from "@/models/entities/tavern";
import { NAME_MAX_LENGTH } from "@/shared/constants/game";
import { cn } from "@/shared/utils/class-names";
import { formatTime } from "@/shared/utils/format";
import { sanitizeName } from "@/shared/utils/text";
import { clampPage, pageCount, pageOf } from "@/shared/utils/pagination";
import { ActionIcon } from "../components/app-icon";
import { Button } from "../components/button";
import { Card, CardBody, CardFooter, CardHeader } from "../components/card";
import { ConfirmDialog } from "../components/confirm-dialog";
import { Field } from "../components/field";
import { Tag } from "../components/tag";
import { List, ListRow } from "../components/list";
import { Pagination } from "../components/pagination";
import { Modal } from "../components/modal";
import { Panel } from "../components/panel";
import { EmptyState } from "../components/empty-state";
import { Tooltip } from "../components/tooltip";
import { PageHeader } from "../layout/page-header";

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
    <Link href={href} className={cn("transition-colors hover:text-highlight", className)}>
      {name}
    </Link>
  );
}

export function TavernScreen() {
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
  } = useGame();

  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [joinPasswords, setJoinPasswords] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [nick, setNick] = useState("");
  const [removing, setRemoving] = useState<PackMate | null>(null);
  const [invites, setInvites] = useState<PackInvite[]>([]);

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

  const {
    identity,
    rooms,
    activeRoom,

    createRoom,
    joinRoom,
    leaveRoom,
    closeRoom,
    openDirect,
    sendMessage,
    announceAway,
  } = useTavern(activeRoomId);
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

  const messagesRef = useRef<HTMLUListElement>(null);

  const lastMessageId = activeRoom?.messages[activeRoom.messages.length - 1]?.id ?? null;

  useEffect(() => {
    const list = messagesRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lastMessageId]);

  const openRoomId = activeRoom ? activeRoomId : null;

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
    for (const { room } of rooms) {
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

  const lastMineAt = useMemo(() => {
    if (!activeRoom) return null;
    for (let index = activeRoom.messages.length - 1; index >= 0; index -= 1) {
      if (activeRoom.messages[index].authorId === selfId) return activeRoom.messages[index].at;
    }
    return null;
  }, [activeRoom, selfId]);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [sentBeat, setSentBeat] = useState(0);
  const sentMapRef = useRef<TavernSentMap>({});
  useEffect(() => {
    sentMapRef.current = tavernSentRepository.load();
  }, []);
  useEffect(() => {
    const compute = () => {
      const marker = activeRoomId ? sentMapRef.current[activeRoomId] : undefined;
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
  }, [lastMineAt, activeRoomId, sentBeat]);
  const lastMessageAt = activeRoom?.messages[activeRoom.messages.length - 1]?.at ?? null;
  useEffect(() => {
    if (!openRoomId || !lastMessageAt) return;
    const timer = window.setTimeout(() => {
      setReadMap((current) => {
        if ((current[openRoomId] ?? "") >= lastMessageAt) return current;
        const alive = new Set(roomsRef.current.map((summary) => summary.room.id));
        const next: TavernReadMap = {};
        for (const [roomId, at] of Object.entries({ ...current, [openRoomId]: lastMessageAt })) {
          if (alive.has(roomId)) next[roomId] = at;
        }
        tavernReadRepository.save(next);
        return next;
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [openRoomId, lastMessageAt]);

  if (!character || !identity) return null;

  const ownRoom =
    rooms.find(({ room, isPrivate }) => !isPrivate && room.ownerId === identity.id) ?? null;

  const openTables = rooms.filter(({ isPrivate }) => !isPrivate).length;

  const closingRoom = rooms.find(({ room }) => room.id === closingRoomId) ?? null;

  const pack = listPack(state);

  const profileHref = (memberId: string): string | null =>
    memberId === identity.id ? "/character" : "/ranking/" + memberId;

  const currentPage = clampPage(page, rooms.length, PAGE_SIZE);
  const pages = pageCount(rooms.length, PAGE_SIZE);
  const roomsOnPage = pageOf(rooms, currentPage, PAGE_SIZE);

  async function open(roomId: string, password: string) {
    const result = await joinRoom(roomId, password);
    if (!result) return;
    notify(result.message, result.ok, "Taverna");
    if (result.ok) {
      playSound("door");
      setActiveRoomId(roomId);
      setJoinPasswords((current) => ({ ...current, [roomId]: "" }));
    }
  }

  async function leave(roomId: string) {
    const result = await leaveRoom(roomId);
    if (!result) return;

    notify(result.message, result.ok, "Taverna");
    if (result.ok) {
      playSound("door");
      if (activeRoomId === roomId) setActiveRoomId(null);
    }
  }

  async function submitRoom(event: FormEvent) {
    event.preventDefault();
    const result = await createRoom(roomName, roomPassword);
    if (!result) return;
    if (!result.ok) notify(result.message, false, "Taverna");
    if (result.ok) {
      setRoomName("");
      setRoomPassword("");
    }
  }

  async function submitMessage(event: FormEvent) {
    event.preventDefault();
    if (!activeRoomId) return;
    const result = await sendMessage(activeRoomId, draft);
    if (!result) return;
    if (result.ok) {
      sentMapRef.current = { ...sentMapRef.current, [activeRoomId]: Date.now() };
      tavernSentRepository.save(sentMapRef.current);
      setSentBeat((count) => count + 1);
      playSound("chat");
      setDraft("");
    } else notify(result.message, false, "Taverna");
  }

  function submitNick(event: FormEvent) {
    event.preventDefault();
    return inviteByNick(nick).then((ok) => {
      if (ok) setNick("");
    });
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
      setActiveRoomId(result.roomId);
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

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Panel
            title="Abrir mesa"
            description={
              ownRoom
                ? "Você já tem uma mesa aberta: feche a sua para abrir outra."
                : "Sem senha, NV " +
                  OPEN_ROOM_MIN_LEVEL +
                  "+ abre e entra. Com senha, qualquer nível."
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
              <Field
                label="Senha (opcional)"
                type="password"
                maxLength={60}
                value={roomPassword}
                placeholder="deixe vazio para mesa aberta"
                autoComplete="new-password"
                disabled={Boolean(ownRoom)}
                onChange={(event) => setRoomPassword(event.target.value)}
              />
              <Tooltip
                block
                label={
                  ownRoom
                    ? "Feche a sua mesa antes de abrir outra"
                    : roomPassword.trim().length === 0 &&
                        (character?.level ?? 1) < OPEN_ROOM_MIN_LEVEL
                      ? "Mesa sem senha é só a partir do NV " +
                        OPEN_ROOM_MIN_LEVEL +
                        ". Ponha uma senha para abrir em qualquer nível."
                      : ""
                }
              >
                <Button
                  type="submit"
                  variant="primary"
                  size="medium"
                  fullWidth
                  disabled={
                    Boolean(ownRoom) ||
                    roomName.trim().length === 0 ||
                    (roomPassword.trim().length === 0 &&
                      (character?.level ?? 1) < OPEN_ROOM_MIN_LEVEL)
                  }
                >
                  {ownRoom ? "Sua mesa: " + ownRoom.room.name : "Abrir mesa"}
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
              <Tooltip block label={pack.length >= MAX_PACK ? "A matilha está cheia" : ""}>
                <Button
                  type="submit"
                  variant="primary"
                  size="medium"
                  fullWidth
                  disabled={nick.trim().length === 0 || pack.length >= MAX_PACK}
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
                    <p className="min-w-0 flex-1 truncate text-sm text-ink">
                      <MemberName href={profileHref(mate.id)} name={mate.name} />
                    </p>

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
            <div className="grid gap-6 sm:grid-cols-2">
              {roomsOnPage.map(({ room, locked, full, memberCount, isMember, isPrivate }) => {
                const unread = unreadByRoom.get(room.id) ?? 0;

                return (
                <Card
                  key={room.id}
                  height="fill"
                  interactive={!full || isMember}
                  tone={isPrivate || room.ownerId === identity.id ? "highlighted" : "default"}
                >
                  <CardHeader>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate text-sm text-ink">{room.name}</h3>
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
                    <ul className="flex grow items-start gap-3 overflow-x-auto pb-1">
                      {room.members.map((member) => (
                        <li key={member.id} className="shrink-0 whitespace-nowrap text-xs">
                          <MemberName
                            href={profileHref(member.id)}
                            name={member.name}
                            className="text-ink-soft"
                          />
                          {!isPrivate && member.id === room.ownerId ? (
                            <span className="ml-1 text-ink-faint">(dono)</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>

                    {locked && !isMember ? (
                      <Field
                        compact
                        type="password"
                        maxLength={60}
                        aria-label={"Senha da mesa " + room.name}
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
                          full && !isMember
                            ? "A mesa está cheia: " + MAX_ROOM_MEMBERS + " pessoas"
                            : ""
                        }
                      >
                        <Button
                          variant={openRoomId === room.id ? "secondary" : "primary"}
                          disabled={full && !isMember}
                          onClick={() => open(room.id, joinPasswords[room.id] ?? "")}
                        >
                          {openRoomId === room.id ? "Aberta" : "Entrar"}
                        </Button>
                      </Tooltip>
                    </div>
                  </CardFooter>
                </Card>
                );
              })}
            </div>
          )}

          <Pagination page={currentPage} pages={pages} onChange={setPage} />
        </div>
      </div>

      <Modal
        open={Boolean(activeRoom)}
        title={activeRoom ? activeRoom.name : ""}
        action={
          activeRoom
            ? activeRoom.members.length + " de " + (activeRoom.privateFor ? 2 : MAX_ROOM_MEMBERS)
            : null
        }
        dismissible={false}
        onClose={() => {
          if (activeRoom) {
            playSound("door");
            void announceAway(activeRoom.id);
          }
          setActiveRoomId(null);
        }}
        className="max-w-lg"
        footer={
          <form onSubmit={submitMessage} className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Field
                compact
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
                <div className="absolute bottom-full right-0 z-30 mb-2 grid grid-cols-4 gap-1 rounded-md border border-edge-strong bg-surface p-2 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.9)]">
                  {["😂", "❤️", "👍", "😮", "😢", "🔥", "🎉", "🍺"].map((emoji) => (
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
                      className="grid h-8 w-8 place-items-center rounded-md text-lg hover:bg-surface-high"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                aria-label="Emojis"
                aria-expanded={emojiOpen}
                onClick={() => setEmojiOpen((open) => !open)}
                className="grid h-8 w-8 place-items-center rounded-md border border-edge text-ink-faint transition-colors hover:border-edge-strong hover:bg-surface-high hover:text-ink"
              >
                <ActionIcon action="smile" className="h-4 w-4" />
              </button>
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={draft.trim().length === 0 || cooldownLeft > 0}
            >
              {cooldownLeft > 0 ? Math.ceil(cooldownLeft / 1000) : "Enviar"}
            </Button>
          </form>
        }
      >
        {activeRoom ? (
          <>
            <div className="flex items-center gap-2 overflow-x-auto border-b border-edge px-4 py-3">
              {activeRoom.members.map((member) => {
                const yourself = member.id === identity.id;
                const kept = isInPack(state, member.id);

                return (
                  <span key={member.id} className="flex shrink-0 items-center gap-1">
                    <Tag tone={yourself ? "neutral" : "faint"} className="gap-2">
                      <MemberName href={profileHref(member.id)} name={member.name} />
                      {kept && !yourself ? (
                        <span className="text-ink-faint">- na matilha</span>
                      ) : null}
                    </Tag>
                    {!yourself && !kept ? (
                      <Tooltip label={"Convidar " + member.name + " para a matilha"}>
                        <button
                          type="button"
                          aria-label={"Convidar " + member.name + " para a matilha"}
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-edge text-ink-faint transition-colors hover:border-edge-strong hover:text-highlight"
                          onClick={() => invite({ id: member.id, name: member.name })}
                        >
                          <ActionIcon action="keep" className="h-3 w-3" />
                        </button>
                      </Tooltip>
                    ) : null}
                  </span>
                );
              })}
            </div>

            <List ref={messagesRef} className="h-80 overflow-y-auto">
              {activeRoom.messages.map((message, index) => (
                <ListRow
                  key={message.id}
                  className={cn("items-start", index % 2 === 1 && "bg-surface-high/50")}
                >
                  <span className="mt-1 font-mono text-[10px] text-ink-faint">
                    {formatTime(message.at)}
                  </span>
                  <p className="min-w-0 flex-1 text-xs leading-relaxed">
                    {message.authorId === "system" ? (
                      <span className="mr-2 text-ink-faint">{message.authorName}:</span>
                    ) : (
                      <>
                        <MemberName
                          href={profileHref(message.authorId)}
                          name={message.authorName}
                          className={cn(
                            message.authorId === identity.id ? "text-ink" : "text-ink-soft",
                          )}
                        />
                        <span className="mr-2 text-ink-faint">:</span>
                      </>
                    )}
                    <span
                      className={cn(
                        message.authorId === "system" ? "text-ink-faint" : "text-ink-soft",
                      )}
                    >
                      {message.text}
                    </span>
                  </p>
                </ListRow>
              ))}
            </List>
          </>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={closingRoomId !== null}
        title={closingRoom?.isPrivate ? "Fechar mesa reservada" : "Fechar mesa"}
        description={
          closingRoom?.isPrivate
            ? "A mesa some para vocês dois e as mensagens se perdem. Chamar de novo abre outra, vazia."
            : "A mesa sai do quadro para todo mundo e a conversa se perde. Abrir outra depois é de graça."
        }
        detail={closingRoom?.room.name}
        confirmLabel="Fechar"
        onCancel={() => setClosingRoomId(null)}
        onConfirm={() => {
          const roomId = closingRoomId;
          setClosingRoomId(null);
          if (!roomId) return;
          return closeRoom(roomId).then((result) => {
            if (result) notify(result.message, result.ok, "Taverna");
            if (result?.ok) {
              playSound("door");
              if (activeRoomId === roomId) setActiveRoomId(null);
            }
          });
        }}
      />

      <ConfirmDialog
        open={removing !== null}
        title="Sair da matilha"
        description="Vocês dois saem da matilha um do outro. Sem o laço não dá para abrir novas mesas reservadas entre vocês; convidar de novo recomeça."
        detail={removing?.name}
        confirmLabel="Sair"
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) removeFromPack(removing.id);
          setRemoving(null);
        }}
      />
    </>
  );
}
