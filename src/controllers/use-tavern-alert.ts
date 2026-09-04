"use client";

import { useEffect, useRef, useState } from "react";
import { tavernPushRepository } from "@/models/repositories/tavern-push.repository";
import { TAVERN_NOTICE_BODY } from "@/shared/constants/moderation";
import { tavernUserStore } from "./tavern-user.store";
import { clearTavernAlerts, pushTavernAlert } from "./tavern-alert.store";
import { useGame } from "./game.context";
import { ensureTavernWorker, notifyTavernMessageLocal, tavernPushActive } from "./tavern-notify";
import { subscribeTavernBoard, tavernBoardSnapshot, type TavernBoardPayload } from "./tavern-stream";
import type { RoomSummary } from "./tavern.controller";

const ALERT_FLASH_MS = 1500;

let lastNotifiedAt: string | null = null;

function unreadFromBoard(rooms: RoomSummary[], selfId: string): number {
  const readMap = tavernUserStore.readSnapshot();
  let total = 0;
  for (const { room, isMember } of rooms) {
    if (!isMember) continue;
    const lastRead = readMap[room.id] ?? "";
    for (const message of room.messages) {
      if (message.authorId === "system" || message.authorId === selfId) continue;
      if (message.at > lastRead) total += 1;
    }
  }
  return total;
}

function latestMessageAt(rooms: RoomSummary[], selfId: string): string {
  let latest = "";
  for (const { room } of rooms) {
    for (const message of room.messages) {
      if (message.authorId === selfId) continue;
      if (message.at > latest) latest = message.at;
    }
  }
  return latest;
}

function freshMessages(
  rooms: RoomSummary[],
  selfId: string,
  since: string,
): { roomName: string; authorName: string; at: string }[] {
  const readMap = tavernUserStore.readSnapshot();
  const found: { roomName: string; authorName: string; at: string }[] = [];
  for (const { room, isMember } of rooms) {
    if (!isMember) continue;
    const lastRead = readMap[room.id] ?? "";
    for (const message of room.messages) {
      if (message.authorId === "system" || message.authorId === selfId) continue;
      if (message.at <= since || message.at <= lastRead) continue;
      found.push({
        roomName: room.name,
        authorName: message.authorName,
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
  const signedIn = authenticated && character !== null;
  const watchingRef = useRef(watching);
  const boardRef = useRef<TavernBoardPayload | null>(tavernBoardSnapshot());

  useEffect(() => {
    watchingRef.current = watching;
    if (!watching) clearTavernAlerts();
  }, [watching]);

  useEffect(() => {
    if (!signedIn) {
      lastNotifiedAt = null;
      clearTavernAlerts();
      return;
    }
    ensureTavernWorker();
    const refreshUnread = () => {
      const board = boardRef.current;
      if (board) setUnread(unreadFromBoard(board.rooms, selfId));
    };
    const stopBoard = subscribeTavernBoard((board) => {
      boardRef.current = board;
      refreshUnread();
      const latest = latestMessageAt(board.rooms, selfId);
      if (lastNotifiedAt !== null && watchingRef.current) {
        const alertsOn = tavernPushRepository.enabled();
        const hidden = document.hidden;
        for (const item of freshMessages(board.rooms, selfId, lastNotifiedAt)) {
          if (alertsOn && !hidden) {
            pushTavernAlert({
              id: item.at + ":" + item.roomName,
              roomName: item.roomName,
              authorName: item.authorName,
              text: TAVERN_NOTICE_BODY,
              at: item.at,
            });
          } else if (hidden && !tavernPushActive()) {
            notifyTavernMessageLocal(item.roomName, item.authorName, TAVERN_NOTICE_BODY, item.at);
          }
        }
      }
      if (latest) lastNotifiedAt = latest;
      else if (lastNotifiedAt === null) lastNotifiedAt = "0";
    });
    const stopRead = tavernUserStore.subscribeRead(refreshUnread);
    return () => {
      stopBoard();
      stopRead();
    };
  }, [signedIn, selfId]);

  const shownUnread = signedIn ? unread : 0;
  const flashing = watching && signedIn && shownUnread > 0;
  const baseRef = useRef<string | null>(null);
  useEffect(() => {
    if (!flashing) return;
    const alert = "[" + shownUnread + "] Mensagens novas";
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
  }, [flashing, shownUnread]);

  return shownUnread;
}
