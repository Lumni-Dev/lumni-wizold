"use client";

import { useEffect, useRef } from "react";
import { tavernPingRepository } from "@/models/repositories/tavern-ping.repository";
import { playSound } from "./sound";
import { latestSeatedChatAt } from "./tavern.controller";
import { subscribeTavernBoard } from "./tavern-stream";
import { useGame } from "./game.context";

export function usePrivateChatPing() {
  const { character, authenticated } = useGame();
  const selfId = character?.id ?? "";
  const enabled = authenticated && character !== null;
  const heardRef = useRef<string | null>(null);

  useEffect(() => {
    heardRef.current = null;
    if (!enabled) return;
    return subscribeTavernBoard((board) => {
      const latest = latestSeatedChatAt(board.rooms, selfId);
      if (!latest) return;
      if (heardRef.current === null) {
        heardRef.current = latest;
        return;
      }
      if (latest <= heardRef.current) return;
      heardRef.current = latest;
      if (tavernPingRepository.enabled()) playSound("ping");
    });
  }, [enabled, selfId]);
}
