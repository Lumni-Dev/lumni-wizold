"use client";

import { api } from "./api.client";

const CHANNEL = "wizold-single-tab";
const HEARTBEAT_MS = 8000;

type TabStatus = "pending" | "active" | "blocked";

let tabId = "";
let statusVal: TabStatus = "pending";
let channel: BroadcastChannel | null = null;
let started = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function setStatus(next: TabStatus): void {
  if (statusVal === next) return;
  statusVal = next;
  emit();
}

async function claim(force: boolean): Promise<boolean | null> {
  const answer = await api<{ owner: string; mine: boolean }>("POST", "/api/session/tab", {
    tabId,
    force,
  });
  if (!answer.ok || !answer.data) return null;
  return answer.data.mine;
}

function beat(): void {
  void claim(false).then((mine) => {
    if (mine === null) return;
    setStatus(mine ? "active" : "blocked");
  });
}

const TAB_ID_KEY = "lumni-wizold:tab-id";

function freshId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "tab-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e9).toString(36);
}

function makeTabId(): string {
  try {
    const existing = window.sessionStorage.getItem(TAB_ID_KEY);
    if (existing) return existing;
    const created = freshId();
    window.sessionStorage.setItem(TAB_ID_KEY, created);
    return created;
  } catch {
    return freshId();
  }
}

function onHide(): void {
  if (statusVal === "active") channel?.postMessage({ type: "bye", tabId });
}

export const singleTab = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  status(): TabStatus {
    return statusVal;
  },
  serverStatus(): TabStatus {
    return "pending";
  },
  start(): void {
    if (started || typeof window === "undefined") return;
    started = true;
    tabId = makeTabId();
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(CHANNEL);
      channel.onmessage = (event) => {
        const msg = event.data;
        if (!msg || typeof msg !== "object" || msg.tabId === tabId) return;
        if (msg.type === "takeover") setStatus("blocked");
        else if (msg.type === "bye" && statusVal === "blocked") beat();
      };
    }
    beat();
    window.setInterval(beat, HEARTBEAT_MS);
    window.addEventListener("pagehide", onHide);
  },
  takeOver(): void {
    void claim(true).then((mine) => {
      if (!mine) return;
      channel?.postMessage({ type: "takeover", tabId });
      setStatus("active");
    });
  },
};
