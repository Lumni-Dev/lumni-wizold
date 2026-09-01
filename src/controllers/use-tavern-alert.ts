"use client";

import { useEffect, useRef, useState } from "react";
import { tavernReadRepository } from "@/models/repositories/tavern-read.repository";
import { useGame } from "./game.context";
import { ensureTavernWorker, notifyTavernMessageLocal, tavernPushActive } from "./tavern-notify";
import { subscribeTavernBoard } from "./tavern-stream";
import type { RoomSummary } from "./tavern.controller";

const ALERT_FLASH_MS = 1500;

function unreadFromBoard(rooms: RoomSummary[], selfId: string): number {
  const readMap = tavernReadRepository.load();
  let total = 0;
  for (const { room } of rooms) {
    const lastRead = readMap[room.id] ?? "";
    for (const message of room.messages) {
      if (message.authorId === "system" || message.authorId === selfId) continue;
      if (message.at > lastRead) total += 1;
    }
  }
  return total;
}

function freshMessages(
  rooms: RoomSummary[],
  selfId: string,
  since: string | null,
): { roomName: string; authorName: string; text: string; at: string }[] {
  if (!since) return [];
  const readMap = tavernReadRepository.load();
  const found: { roomName: string; authorName: string; text: string; at: string }[] = [];
  for (const { room, isMember } of rooms) {
    if (!isMember) continue;
    const lastRead = readMap[room.id] ?? "";
    for (const message of room.messages) {
      if (message.authorId === "system" || message.authorId === selfId) continue;
      if (message.at <= since || message.at <= lastRead) continue;
      found.push({
        roomName: room.name,
        authorName: message.authorName,
        text: message.text,
        at: message.at,
      });
    }
  }
  return found;
}

export function useTavernAlert(watching: boolean) {
  const { character, authenticated } = useGame();
  const [unread, setUnread] = useState(0);
  const selfId = character?.id ?? "";
  const enabled = watching && authenticated && character !== null;
  const notifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    ensureTavernWorker();
    return subscribeTavernBoard((board) => {
      setUnread(unreadFromBoard(board.rooms, selfId));
      const pushOn = tavernPushActive();
      let latest = notifiedRef.current ?? "";
      for (const { room } of board.rooms) {
        for (const message of room.messages) {
          if (message.at > latest) latest = message.at;
        }
      }
      if (!pushOn && document.hidden && notifiedRef.current !== null) {
        for (const item of freshMessages(board.rooms, selfId, notifiedRef.current)) {
          notifyTavernMessageLocal(item.roomName, item.authorName, item.text, item.at);
        }
      }
      notifiedRef.current = latest;
    });
  }, [enabled, selfId]);

  const baseRef = useRef<string | null>(null);
  useEffect(() => {
    if (!enabled || unread === 0) return;
    const alert = "[" + unread + "] Mensagens novas";
    let showingAlert = false;
    const timer = window.setInterval(() => {
      showingAlert = !showingAlert;
      if (showingAlert) {
        if (!document.title.startsWith("[")) baseRef.current = document.title;
        document.title = alert;
      } else if (baseRef.current) {
        document.title = baseRef.current;
      }
    }, ALERT_FLASH_MS);
    return () => {
      window.clearInterval(timer);
      if (document.title.startsWith("[") && baseRef.current) {
        document.title = baseRef.current;
      }
    };
  }, [enabled, unread]);

  return unread;
}
