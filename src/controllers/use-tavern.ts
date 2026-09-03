"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TAVERN_VERSION, type TavernIdentity } from "@/models/entities/tavern";
import { isVip } from "@/models/rules/vip";
import { api } from "./api.client";
import { useGame } from "./game.context";
import {
  applyLocalBoard,
  refreshTavernBoard,
  subscribeTavernBoard,
  tavernBoardSnapshot,
} from "./tavern-stream";
import * as tavernController from "./tavern.controller";
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
  const { character, authenticated, notify } = useGame();
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
      mine.forEach((summary, index) => {
        window.setTimeout(() => {
          void api("POST", "/api/tavern/rooms/" + encodeURIComponent(summary.room.id) + "/heartbeat");
        }, index * 250);
      });
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
    createRoom: (name: string, password: string, hideName = false) =>
      perform("POST", "/api/tavern/rooms", { name, password, hideName }),
    joinRoom: (roomId: string, password: string) =>
      perform("POST", "/api/tavern/rooms/" + encodeURIComponent(roomId) + "/join", { password }),
    leaveRoom: (roomId: string) =>
      perform("POST", "/api/tavern/rooms/" + encodeURIComponent(roomId) + "/leave"),
    closeRoom: (roomId: string) =>
      perform("POST", "/api/tavern/rooms/" + encodeURIComponent(roomId) + "/close"),
    openDirect: (other: TavernIdentity) =>
      perform("POST", "/api/tavern/direct", { otherId: other.id }),
    sendMessage: (roomId: string, text: string) => {
      const who = identity;
      if (who) {
        const board = tavernBoardSnapshot() ?? boardRef.current;
        const preview = tavernController.sendMessage(
          { version: TAVERN_VERSION, rooms: board.rooms.map((summary) => summary.room) },
          roomId,
          who,
          text,
        );
        if (!preview.ok) {
          return Promise.resolve({ ok: false, message: preview.message });
        }
        applyLocalBoard({
          identity: board.identity,
          rooms: tavernController.listRooms(preview.state, who),
        });
      }
      void perform(
        "POST",
        "/api/tavern/rooms/" + encodeURIComponent(roomId) + "/messages",
        { text },
      ).then((answer) => {
        if (answer.ok) return;
        void refreshTavernBoard();
        notify(answer.message, false, "Taverna");
      });
      return Promise.resolve({ ok: true, message: "Mensagem enviada." });
    },
    announceAway: (roomId: string) =>
      perform("POST", "/api/tavern/rooms/" + encodeURIComponent(roomId) + "/away"),
  };
}
