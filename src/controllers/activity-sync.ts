"use client";

import type { Activity } from "@/models/entities/activity";
import type { GameState } from "@/models/entities/game-state";
import {
  clearActivityRuntime,
  publishActivityRuntime,
  type ActivityRuntimeSnapshot,
} from "./activity-runtime";

const CHANNEL_NAME = "lumni-wizold:activity";

export const OWNER_BEAT_MS = 4000;
export const OWNER_SILENCE_MS = 14000;
export const HANDSHAKE_MS = 400;

export interface ActivityClaim {
  tab: string;
  since: number;
  activity: Activity;
  runtime: ActivityRuntimeSnapshot;
}

type Message =
  | {
      kind: "beat";
      tab: string;
      since: number;
      activity: Activity;
      runtime: ActivityRuntimeSnapshot;
    }
  | { kind: "idle"; tab: string }
  | { kind: "stop"; tab: string; target: string }
  | { kind: "state"; tab: string; state: GameState }
  | { kind: "hello"; tab: string }
  | { kind: "notice"; tab: string; text: string; ok: boolean; source: string };

export interface TabHandlers {
  onBeat: (claim: ActivityClaim) => void;
  onIdle: (tab: string) => void;
  onStop: () => void;
  onState: (state: GameState) => void;
  onHello: () => void;
  onNotice: (notice: { text: string; ok: boolean; source: string }) => void;
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
  runtime: ActivityRuntimeSnapshot,
): void {
  post({ kind: "beat", tab: tabId(), since, activity, runtime });
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

export function shareNotice(text: string, ok: boolean, source: string): void {
  post({ kind: "notice", tab: tabId(), text, ok, source });
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
        runtime: message.runtime,
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
    if (message.kind === "notice") {
      if (typeof message.text === "string" && message.text) {
        handlers.onNotice({ text: message.text, ok: message.ok, source: message.source });
      }
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
  if (!claim.runtime || typeof claim.runtime !== "object") return;
  mirror = claim;
  publishActivityRuntime(claim.runtime);
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
  clearActivityRuntime();
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
