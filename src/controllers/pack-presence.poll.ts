"use client";

import type { PresenceStatus } from "@/models/entities/presence";
import { PRESENCE_POLL_MS } from "@/models/rules/presence";
import { api } from "./api.client";

export interface PackMatePresence {
  id: string;
  status: PresenceStatus;
  vip?: boolean;
}

type Listener = (mates: PackMatePresence[]) => void;

// One poll of GET /api/pack/presence shared by every hook that wants it: the
// pack alert in the frame and the presence lists in the tavern used to run
// their own intervals against the same endpoint.
const listeners = new Set<Listener>();
let timer = 0;
let inFlight = false;
let last: PackMatePresence[] | null = null;
let lastAt = 0;
const MIN_GAP_MS = 5000;

async function load(force = false): Promise<void> {
  if (inFlight) return;
  if (!force && Date.now() - lastAt < MIN_GAP_MS) return;
  inFlight = true;
  try {
    const answer = await api<{ mates: PackMatePresence[] }>("GET", "/api/pack/presence");
    if (!answer.ok || !answer.data) return;
    last = answer.data.mates;
    lastAt = Date.now();
    for (const listener of listeners) listener(last);
  } finally {
    inFlight = false;
  }
}

function onVisible(): void {
  if (document.visibilityState === "visible") void load();
}

export function subscribePackPresence(listener: Listener): () => void {
  listeners.add(listener);
  if (last) listener(last);
  if (listeners.size === 1) {
    timer = window.setInterval(() => void load(), PRESENCE_POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
  }
  void load();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.clearInterval(timer);
      timer = 0;
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

// The roster changed (someone joined or left the pack): read again at once.
export function refreshPackPresence(): void {
  void load(true);
}
