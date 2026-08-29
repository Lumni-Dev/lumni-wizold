"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useGame } from "@/controllers/game.context";
import { isInPack, listPack } from "@/controllers/pack.controller";
import { playSound } from "@/controllers/sound";
import { useTavern } from "@/controllers/use-tavern";
import { MAX_PACK, type PackMate } from "@/models/entities/pack";
import {
  MAX_ROOM_MEMBERS,
  MESSAGE_MAX_LENGTH,
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
  const { state, character, notify, addToPack, addToPackByNick, removeFromPack } = useGame();

  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [joinPasswords, setJoinPasswords] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [page, setPage] = useState(1);
  const [nick, setNick] = useState("");
  const [removing, setRemoving] = useState<PackMate | null>(null);

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
  } = useTavern(activeRoomId);
  const [closingRoomId, setClosingRoomId] = useState<string | null>(null);

  const messagesRef = useRef<HTMLUListElement>(null);

  const lastMessageId = activeRoom?.messages[activeRoom.messages.length - 1]?.id ?? null;

  useEffect(() => {
    const list = messagesRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lastMessageId]);

  const openRoomId = activeRoom ? activeRoomId : null;

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
      playSound("chat");
      setDraft("");
    } else notify(result.message, false, "Taverna");
  }

  function submitNick(event: FormEvent) {
    event.preventDefault();
    return addToPackByNick(nick).then((ok) => {
      if (ok) setNick("");
    });
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
          "Salas de conversa para até " +
          MAX_ROOM_MEMBERS +
          " pessoas, com ou sem senha. A sala fecha sozinha quando a última pessoa sai."
        }
        action={
          <Tag tone="neutral">
            {openTables === 1 ? "1 sala aberta" : openTables + " salas abertas"}
          </Tag>
        }
      />

      <Panel
        title="Alcance desta taverna"
        description="Leia antes de combinar encontro com alguém."
      >
        <p className="text-xs leading-relaxed text-ink-soft">
          As salas vivem no servidor: quem estiver jogando, de qualquer máquina, senta nas mesmas
          mesas e lê as mesmas falas. A senha de sala é uma combinação entre jogadores, guardada
          cifrada; ainda assim, invente uma só para a mesa, nunca uma senha que você usa em outro
          lugar.
        </p>
      </Panel>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Panel
            title="Abrir sala"
            description={
              ownRoom
                ? "Você já tem uma mesa aberta: feche a sua para abrir outra."
                : "Sem senha, qualquer um entra."
            }
          >
            <form onSubmit={submitRoom} className="space-y-3">
              <Field
                label="Nome da sala"
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
                value={roomPassword}
                placeholder="deixe vazio para sala aberta"
                autoComplete="new-password"
                disabled={Boolean(ownRoom)}
                onChange={(event) => setRoomPassword(event.target.value)}
              />
              <Tooltip block label={ownRoom ? "Feche a sua mesa antes de abrir outra" : ""}>
                <Button
                  type="submit"
                  variant="primary"
                  size="medium"
                  fullWidth
                  disabled={Boolean(ownRoom) || roomName.trim().length === 0}
                >
                  {ownRoom ? "Sua mesa: " + ownRoom.room.name : "Abrir sala"}
                </Button>
              </Tooltip>
            </form>
          </Panel>

          <Panel
            title="Matilha"
            description="Os nomes que você guarda. Chamar um abre uma mesa só de vocês dois."
            action={
              <Tag tone="neutral">
                {pack.length} de {MAX_PACK}
              </Tag>
            }
            padding="none"
          >
            <form onSubmit={submitNick} className="space-y-3 border-b border-edge p-4">
              <Field
                label="Adicionar pelo nick"
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
                  Adicionar à matilha
                </Button>
              </Tooltip>
            </form>

            {pack.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Matilha vazia"
                  description="Guarde alguém de dentro de uma sala ou pelo nick para ter a quem chamar."
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
                    <Tooltip label={"Excluir " + mate.name + " da matilha"}>
                      <Button
                        icon
                        variant="ghost"
                        aria-label={"Excluir " + mate.name + " da matilha"}
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
              title="Nenhuma sala aberta"
              description="Abra a primeira e espere alguém puxar a cadeira."
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {roomsOnPage.map(({ room, locked, full, memberCount, isMember, isPrivate }) => (
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
                    <ul className="grow space-y-1">
                      {room.members.map((member) => (
                        <li key={member.id} className="truncate text-xs">
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
                        aria-label={"Senha da sala " + room.name}
                        placeholder="senha da sala"
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
                          ? "Sala cheia"
                          : isMember
                            ? "Seu lugar está guardado"
                            : "Livre"}
                    </span>
                    <div className="flex items-center gap-2">
                      {isPrivate || room.ownerId === identity.id ? (
                        <Button variant="ghost" onClick={() => setClosingRoomId(room.id)}>
                          Fechar sala
                        </Button>
                      ) : isMember ? (
                        <Button variant="ghost" onClick={() => leave(room.id)}>
                          Sair
                        </Button>
                      ) : null}
                      <Tooltip
                        label={
                          full && !isMember
                            ? "A sala está cheia: " + MAX_ROOM_MEMBERS + " pessoas"
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
              ))}
            </div>
          )}

          <Pagination page={currentPage} pages={pages} onChange={setPage} />
        </div>
      </div>

      <Modal
        open={Boolean(activeRoom)}
        title={activeRoom ? activeRoom.name : ""}
        dismissible={false}
        onClose={() => {
          if (activeRoom) playSound("door");
          setActiveRoomId(null);
        }}
        className="max-w-lg"
        footer={
          <form onSubmit={submitMessage} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <Field
                compact
                aria-label="Mensagem"
                placeholder="Diga alguma coisa"
                maxLength={MESSAGE_MAX_LENGTH}
                autoComplete="off"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            </div>
            <Button type="submit" variant="primary" disabled={draft.trim().length === 0}>
              Enviar
            </Button>
          </form>
        }
      >
        {activeRoom ? (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-edge px-4 py-3">
              {activeRoom.members.map((member) => {
                const yourself = member.id === identity.id;
                const kept = isInPack(state, member.id);

                return (
                  <span key={member.id} className="flex items-center gap-1">
                    <Tag tone={yourself ? "neutral" : "faint"} className="gap-2">
                      <MemberName href={profileHref(member.id)} name={member.name} />
                      {kept && !yourself ? (
                        <span className="text-ink-faint">· na matilha</span>
                      ) : null}
                    </Tag>
                    {!yourself && !kept ? (
                      <Tooltip label={"Guardar " + member.name + " na sua matilha"}>
                        <button
                          type="button"
                          aria-label={"Guardar " + member.name + " na sua matilha"}
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-edge text-ink-faint transition-colors hover:border-edge-strong hover:text-highlight"
                          onClick={() => addToPack({ id: member.id, name: member.name })}
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
              {activeRoom.messages.map((message) => (
                <ListRow key={message.id} className="items-start">
                  <span className="mt-1 font-mono text-[10px] text-ink-faint">
                    {formatTime(message.at)}
                  </span>
                  <p className="min-w-0 flex-1 text-xs leading-relaxed">
                    {message.authorId === "system" ? (
                      <span className="mr-2 text-ink-faint">{message.authorName}</span>
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
        title={closingRoom?.isPrivate ? "Fechar mesa reservada" : "Fechar sala"}
        description={
          closingRoom?.isPrivate
            ? "A mesa some para vocês dois e as mensagens se perdem. Chamar de novo abre outra, vazia."
            : "A mesa sai do quadro para todo mundo e a conversa se perde. Abrir outra depois é de graça."
        }
        detail={closingRoom?.room.name}
        confirmLabel="Fechar"
        onCancel={() => setClosingRoomId(null)}
        onConfirm={() => {
          if (closingRoomId) {
            return closeRoom(closingRoomId).then((result) => {
              if (result) notify(result.message, result.ok, "Taverna");
              if (result?.ok) {
                playSound("door");
                if (activeRoomId === closingRoomId) setActiveRoomId(null);
              }
            });
          }
          setClosingRoomId(null);
        }}
      />

      <ConfirmDialog
        open={removing !== null}
        title="Excluir da matilha"
        description="O nome sai da sua lista. Guardar de novo é de graça, e a mesa reservada entre vocês continua aberta até alguém fechá-la."
        detail={removing?.name}
        confirmLabel="Excluir"
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) removeFromPack(removing.id);
          setRemoving(null);
        }}
      />
    </>
  );
}
