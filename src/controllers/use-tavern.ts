"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TavernIdentity } from "@/models/entities/tavern";
import { api } from "./api.client";
import { useGame } from "./game.context";
import type { RoomSummary } from "./tavern.controller";

// The tavern now lives on the server, which is what makes it a real tavern:
// every browser sees the same tables. The hook polls the board, beats the
// heartbeat for the seats it holds, and every action is an endpoint.

const POLL_MS = 5_000;
const ACTIVE_POLL_MS = 3_000;
const HEARTBEAT_MS = 12_000;

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
  const boardRef = useRef(board);
  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  const enabled = authenticated && character !== null;

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const answer = await api<TavernBoard>("GET", "/api/tavern");
    if (answer.ok && answer.data) setBoard(answer.data);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const first = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(
      () => void refresh(),
      activeRoomId ? ACTIVE_POLL_MS : POLL_MS,
    );
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [enabled, activeRoomId, refresh]);

  // One heartbeat per held seat: the server prunes whoever goes quiet.
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
      const answer = await api<{ roomId?: string }>(method, path, body);
      await refresh();
      return { ok: answer.ok, message: answer.message, roomId: answer.data?.roomId };
    },
    [refresh],
  );

  const identity = useMemo<TavernIdentity | null>(
    () => board.identity ?? (character ? { id: character.id, name: character.name } : null),
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
    activeRoom,
    atTables,
    refresh,
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
  };
}
