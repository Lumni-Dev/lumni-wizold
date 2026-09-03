"use client";

import { api } from "./api.client";
import type { RoomSummary } from "./tavern.controller";
import type { TavernIdentity } from "@/models/entities/tavern";
import type { TavernUserState } from "@/models/entities/tavern";
import { tavernUserStore } from "./tavern-user.store";

export interface TavernBoardPayload {
  identity: TavernIdentity | null;
  rooms: RoomSummary[];
  revision?: number;
  user?: TavernUserState;
}

type BoardListener = (board: TavernBoardPayload) => void;

let source: EventSource | null = null;
const listeners = new Set<BoardListener>();
let reconnectTimer = 0;
let fallbackTimer = 0;
let lastBoard: TavernBoardPayload | null = null;

function notify(board: TavernBoardPayload) {
  lastBoard = board;
  if (board.user) tavernUserStore.adoptUser(board.user, board.rooms);
  for (const listener of listeners) listener(board);
}

async function fallbackPoll() {
  const answer = await api<TavernBoardPayload>("POST", "/api/tavern");
  if (answer.ok && answer.data) notify(answer.data);
}

function connect() {
  if (source || listeners.size === 0) return;
  source = new EventSource("/api/tavern/stream");
  source.addEventListener("board", (event) => {
    try {
      notify(JSON.parse(event.data) as TavernBoardPayload);
    } catch {}
  });
  source.addEventListener("end", () => disconnect());
  source.onerror = () => {
    disconnect();
    reconnectTimer = window.setTimeout(connect, 3000);
  };
}

function disconnect() {
  source?.close();
  source = null;
}

function ensureFallback() {
  if (fallbackTimer) return;
  fallbackTimer = window.setInterval(() => {
    if (listeners.size === 0) return;
    void fallbackPoll();
  }, 30000);
}

export function subscribeTavernBoard(listener: BoardListener): () => void {
  listeners.add(listener);
  if (lastBoard) listener(lastBoard);
  connect();
  ensureFallback();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      disconnect();
      window.clearTimeout(reconnectTimer);
      reconnectTimer = 0;
    }
  };
}

export function tavernBoardSnapshot(): TavernBoardPayload | null {
  return lastBoard;
}

export function applyLocalBoard(board: TavernBoardPayload): void {
  notify(board);
}

export async function refreshTavernBoard(): Promise<void> {
  await fallbackPoll();
}
