"use client";
import { useEffect, useRef, useState } from "react";
import { tavernReadRepository } from "@/models/repositories/tavern-read.repository";
import { api } from "./api.client";
import { useGame } from "./game.context";
import type { RoomSummary } from "./tavern.controller";

const ALERT_POLL_MS = 15000;
const ALERT_FLASH_MS = 1500;

export function useTavernAlert(watching: boolean) {
  const { character, authenticated } = useGame();
  const [unread, setUnread] = useState(0);
  const selfId = character?.id ?? "";
  const enabled = watching && authenticated && character !== null;

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const look = async () => {
      const answer = await api<{ rooms: RoomSummary[] }>("POST", "/api/tavern");
      if (!alive || !answer.ok || !answer.data) return;
      const readMap = tavernReadRepository.load();
      let total = 0;
      for (const { room } of answer.data.rooms) {
        const lastRead = readMap[room.id] ?? "";
        total += room.messages.filter(
          (message) =>
            message.at > lastRead &&
            message.authorId !== "system" &&
            message.authorId !== selfId,
        ).length;
      }
      setUnread(total);
    };
    void look();
    const timer = window.setInterval(() => void look(), ALERT_POLL_MS);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
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
