"use client";

import type { Activity } from "@/models/entities/activity";
import type { GameState } from "@/models/entities/game-state";
import type { ActivityDockView } from "./activity-runtime";

const CHANNEL_NAME = "lumni-wizold:activity";

export const OWNER_BEAT_MS = 4000;
export const OWNER_SILENCE_MS = 14000;
export const HANDSHAKE_MS = 400;

export interface ActivityClaim {
  tab: string;
  since: number;
  activity: Activity;
  dock: ActivityDockView | null;
}

type Message =
  | {
      kind: "beat";
      tab: string;
      since: number;
      activity: Activity;
      dock: ActivityDockView | null;
    }
  | { kind: "idle"; tab: string }
  | { kind: "stop"; tab: string; target: string }
  | { kind: "state"; tab: string; state: GameState }
  | { kind: "hello"; tab: string };

export interface TabHandlers {
  onBeat: (claim: ActivityClaim) => void;
  onIdle: (tab: string) => void;
  onStop: () => void;
  onState: (state: GameState) => void;
  onHello: () => void;
}

let id = "";
let channel: BroadcastChannel | null = null;
let opened = false;

export function tabId(): string {
  if (!id) {
    id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  return id;
}

function open(): BroadcastChannel | null {
  if (opened) return channel;
  opened = true;
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
  } catch {
    channel = null;
  }
  return channel;
}

function post(message: Message): void {
  const bus = open();
  if (!bus) return;
  try {
    bus.postMessage(message);
  } catch {}
}

export function yieldsTo(mine: number, theirs: number, theirTab: string): boolean {
  if (mine !== theirs) return mine < theirs;
  return tabId() > theirTab;
}

export function announceBeat(
  since: number,
  activity: Activity,
  dock: ActivityDockView | null,
): void {
  post({ kind: "beat", tab: tabId(), since, activity, dock });
}

export function announceIdle(): void {
  post({ kind: "idle", tab: tabId() });
}

export function announceHello(): void {
  post({ kind: "hello", tab: tabId() });
}

export function askToStop(target: string): void {
  post({ kind: "stop", tab: tabId(), target });
}

export function shareState(state: GameState): void {
  post({ kind: "state", tab: tabId(), state });
}

export function listenToTabs(handlers: TabHandlers): () => void {
  const bus = open();
  if (!bus) return () => undefined;

  const receive = (event: MessageEvent<Message>) => {
    const message = event.data;
    if (!message || typeof message !== "object" || message.tab === tabId()) return;

    if (message.kind === "beat") {
      handlers.onBeat({
        tab: message.tab,
        since: message.since,
        activity: message.activity,
        dock: message.dock,
      });
      return;
    }
    if (message.kind === "idle") {
      handlers.onIdle(message.tab);
      return;
    }
    if (message.kind === "stop") {
      if (message.target === tabId()) handlers.onStop();
      return;
    }
    if (message.kind === "state") {
      handlers.onState(message.state);
      return;
    }
    if (message.kind === "hello") handlers.onHello();
  };

  bus.addEventListener("message", receive);
  return () => bus.removeEventListener("message", receive);
}

let mirror: ActivityClaim | null = null;
let fade = 0;
const mirrorListeners = new Set<() => void>();

function emitMirror(): void {
  for (const listener of mirrorListeners) listener();
}

export function watchMirror(claim: ActivityClaim): void {
  mirror = claim;
  if (typeof window !== "undefined") {
    window.clearTimeout(fade);
    fade = window.setTimeout(() => dropMirror(), OWNER_SILENCE_MS);
  }
  emitMirror();
}

export function dropMirror(tab?: string): void {
  if (mirror === null) return;
  if (tab !== undefined && mirror.tab !== tab) return;
  mirror = null;
  if (typeof window !== "undefined") window.clearTimeout(fade);
  emitMirror();
}

export const activityMirrorStore = {
  subscribe(listener: () => void): () => void {
    mirrorListeners.add(listener);
    return () => mirrorListeners.delete(listener);
  },
  snapshot(): ActivityClaim | null {
    return mirror;
  },
  serverSnapshot(): ActivityClaim | null {
    return null;
  },
};
