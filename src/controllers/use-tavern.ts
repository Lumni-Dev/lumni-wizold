"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TavernIdentity } from "@/models/entities/tavern";
import { isVip } from "@/models/rules/vip";
import { api } from "./api.client";
import { useGame } from "./game.context";
import { subscribeTavernBoard } from "./tavern-stream";
import type { RoomSummary } from "./tavern.controller";

const HEARTBEAT_MS = 12000;

export interface TavernAnswer {
  ok: boolean;
  message: string;
  roomId?: string;
}

interface TavernBoard {
  identity: TavernIdentity | null;
  rooms: RoomSummary[];
}

export function useTavern(activeRoomId: string | null) {
  const { character, authenticated } = useGame();
  const [board, setBoard] = useState<TavernBoard>({ identity: null, rooms: [] });
  const [ready, setReady] = useState(false);
  const boardRef = useRef(board);
  useEffect(() => {
    boardRef.current = board;
  }, [board]);
  const enabled = authenticated && character !== null;

  useEffect(() => {
    if (!enabled) {
      setBoard({ identity: null, rooms: [] });
      setReady(false);
      return;
    }
    return subscribeTavernBoard((payload) => {
      setBoard({ identity: payload.identity, rooms: payload.rooms });
      setReady(true);
    });
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const beat = () => {
      const mine = boardRef.current.rooms.filter((summary) => summary.isMember);
      for (const summary of mine) {
        void api("POST", "/api/tavern/rooms/" + encodeURIComponent(summary.room.id) + "/heartbeat");
      }
    };
    beat();
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    return () => window.clearInterval(timer);
  }, [enabled]);

  const perform = useCallback(
    async (method: "POST", path: string, body?: unknown): Promise<TavernAnswer> => {
      const answer = await api<{
        roomId?: string;
      }>(method, path, body);
      return { ok: answer.ok, message: answer.message, roomId: answer.data?.roomId };
    },
    [],
  );

  const identity = useMemo<TavernIdentity | null>(
    () =>
      board.identity ??
      (character
        ? {
            id: character.id,
            name: character.name,
            level: character.level,
            vip: isVip(character, Date.now()),
          }
        : null),
    [board.identity, character],
  );
  const rooms = board.rooms;
  const activeRoom = activeRoomId
    ? rooms.find((summary) => summary.room.id === activeRoomId)?.room
    : undefined;
  const atTables = useMemo(() => {
    const seen = new Map<string, TavernIdentity>();
    for (const summary of rooms) {
      if (summary.isPrivate) continue;
      for (const member of summary.room.members) {
        if (identity && member.id === identity.id) continue;
        if (!seen.has(member.id)) seen.set(member.id, { id: member.id, name: member.name });
      }
    }
    return [...seen.values()];
  }, [rooms, identity]);

  return {
    identity,
    rooms,
    ready,
    activeRoom,
    atTables,
    refresh: async () => {
      const answer = await api<TavernBoard>("POST", "/api/tavern");
      if (answer.ok && answer.data) setBoard(answer.data);
    },
    createRoom: (name: string, password: string) =>
      perform("POST", "/api/tavern/rooms", { name, password }),
    joinRoom: (roomId: string, password: string) =>
      perform("POST", "/api/tavern/rooms/" + encodeURIComponent(roomId) + "/join", { password }),
    leaveRoom: (roomId: string) =>
      perform("POST", "/api/tavern/rooms/" + encodeURIComponent(roomId) + "/leave"),
    closeRoom: (roomId: string) =>
      perform("POST", "/api/tavern/rooms/" + encodeURIComponent(roomId) + "/close"),
    openDirect: (other: TavernIdentity) =>
      perform("POST", "/api/tavern/direct", { otherId: other.id }),
    sendMessage: (roomId: string, text: string) =>
      perform("POST", "/api/tavern/rooms/" + encodeURIComponent(roomId) + "/messages", { text }),
    announceAway: (roomId: string) =>
      perform("POST", "/api/tavern/rooms/" + encodeURIComponent(roomId) + "/away"),
  };
}
