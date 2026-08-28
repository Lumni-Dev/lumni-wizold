"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { tavernRepository } from "@/models/repositories/tavern.repository";
import { isPrivateTable, type TavernIdentity, type TavernResult } from "@/models/entities/tavern";
import { useGame } from "./game.context";
import * as tavern from "./tavern.controller";

const PRUNE_INTERVAL_MS = 15_000;
const HEARTBEAT_MS = 12_000;

export function useTavern(activeRoomId: string | null) {
  const { character } = useGame();

  const state = useSyncExternalStore(
    tavernRepository.subscribe,
    tavernRepository.snapshot,
    tavernRepository.serverSnapshot,
  );

  const identity = useMemo<TavernIdentity | null>(
    () => (character ? { id: character.id, name: character.name } : null),
    [character],
  );

  const apply = useCallback((result: TavernResult): TavernResult => {
    if (result.ok) tavernRepository.save(result.state);
    return result;
  }, []);

  useEffect(() => {
    if (!identity) return;

    const beat = () => {
      const current = tavernRepository.snapshot();
      const mine = current.rooms.filter((room) =>
        room.members.some((member) => member.id === identity.id),
      );
      if (mine.length === 0) return;
      tavernRepository.save(
        mine.reduce((next, room) => tavern.touchMember(next, room.id, identity), current),
      );
    };

    beat();
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    return () => window.clearInterval(timer);
  }, [identity]);

  useEffect(() => {
    const prune = () => {
      const current = tavernRepository.snapshot();
      const pruned = tavern.pruneTavern(current, Date.now());
      if (pruned !== current) tavernRepository.save(pruned);
    };

    prune();
    const timer = window.setInterval(prune, PRUNE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  const rooms = useMemo(() => tavern.listRooms(state, identity), [state, identity]);
  const activeRoom = activeRoomId ? tavern.findRoom(state, activeRoomId) : undefined;

  const atTables = useMemo(() => {
    const seen = new Map<string, TavernIdentity>();

    for (const room of state.rooms) {
      if (isPrivateTable(room)) continue;
      for (const member of room.members) {
        if (identity && member.id === identity.id) continue;
        if (!seen.has(member.id)) seen.set(member.id, { id: member.id, name: member.name });
      }
    }

    return [...seen.values()];
  }, [state, identity]);

  return {
    identity,
    rooms,
    activeRoom,
    atTables,
    createRoom: (name: string, password: string) =>
      identity
        ? apply(tavern.createRoom(tavernRepository.snapshot(), identity, name, password))
        : null,
    joinRoom: (roomId: string, password: string) =>
      identity
        ? apply(tavern.joinRoom(tavernRepository.snapshot(), roomId, identity, password))
        : null,
    leaveRoom: (roomId: string) =>
      identity ? apply(tavern.leaveRoom(tavernRepository.snapshot(), roomId, identity)) : null,
    closeRoom: (roomId: string) =>
      identity ? apply(tavern.closeRoom(tavernRepository.snapshot(), roomId, identity)) : null,
    openDirect: (other: TavernIdentity) =>
      identity ? apply(tavern.openDirect(tavernRepository.snapshot(), identity, other)) : null,
    sendMessage: (roomId: string, text: string) =>
      identity
        ? apply(tavern.sendMessage(tavernRepository.snapshot(), roomId, identity, text))
        : null,
  };
}
