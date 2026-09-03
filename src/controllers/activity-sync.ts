"use client";

import type { Activity } from "@/models/entities/activity";
import type { GameState } from "@/models/entities/game-state";
import type { PresenceStatus } from "@/models/entities/presence";
import type { ActivityRuntimeSnapshot } from "./activity-runtime";
import { activityMirrorStore } from "./activity-mirror.store";
import { activityRuntimeStore } from "./activity-runtime";

export const HANDSHAKE_MS = 500;
export const OWNER_SILENCE_MS = 12000;
const CHANNEL_NAME = "lumni-wizold:activity";
const TAB_KEY = "lumni-wizold:tab-id";

type Claim = { tabId: string; at: number };
type SyncRole = "owner" | "mirror" | "idle";

type SyncMessage =
  | { type: "hello"; tabId: string }
  | { type: "claim"; tabId: string; at: number; activity: Activity }
  | {
      type: "sync";
      tabId: string;
      at: number;
      activity: Activity | null;
      runtime: ActivityRuntimeSnapshot | null;
    }
  | { type: "state"; tabId: string; state: GameState }
  | { type: "stop"; tabId: string; from: string }
  | { type: "idle"; tabId: string }
  | {
      type: "notice";
      tabId: string;
      text: string;
      ok: boolean;
      source: string;
      dot?: PresenceStatus;
      id: number;
    };

type Handlers = {
  shouldParticipate: () => boolean;
  onRemoteStop: () => void;
  onRemoteState: (state: GameState) => void;
  onRemoteNotice: (payload: {
    text: string;
    ok: boolean;
    source: string;
    dot?: PresenceStatus;
    id: number;
  }) => void;
};

let channel: BroadcastChannel | null = null;
let tabId = "server";
let role: SyncRole = "idle";
let ownClaim: Claim | null = null;
let remoteClaim: Claim | null = null;
let ownerTabId: string | null = null;
let lastOwnerAt = 0;
let handshaking = false;
let handlers: Handlers | null = null;
let silenceTimer = 0;
let publishTimer = 0;
let localActivity: Activity | null = null;
const roleListeners = new Set<() => void>();

function supported(): boolean {
  return typeof window !== "undefined" && typeof BroadcastChannel !== "undefined";
}

function getTabId(): string {
  if (typeof sessionStorage === "undefined") return "ssr";
  let id = sessionStorage.getItem(TAB_KEY);
  if (!id) {
    id = "tab_" + Math.random().toString(36).slice(2, 11);
    sessionStorage.setItem(TAB_KEY, id);
  }
  return id;
}

function beatsClaim(a: Claim, b: Claim): boolean {
  if (a.at !== b.at) return a.at > b.at;
  return a.tabId > b.tabId;
}

function setRole(next: SyncRole): void {
  role = next;
  for (const listener of roleListeners) listener();
}

function post(message: SyncMessage): void {
  channel?.postMessage(message);
}

function applyMirror(activity: Activity | null, runtime: ActivityRuntimeSnapshot | null): void {
  setRole("mirror");
  ownClaim = null;
  localActivity = null;
  activityMirrorStore.setMirror(activity, runtime);
}

function clearMirror(): void {
  if (role !== "mirror") return;
  setRole("idle");
  ownerTabId = null;
  activityMirrorStore.clear();
}

function touchOwner(): void {
  lastOwnerAt = Date.now();
}

function resetSilenceWatch(): void {
  window.clearInterval(silenceTimer);
  silenceTimer = window.setInterval(() => {
    if (role !== "mirror") return;
    if (Date.now() - lastOwnerAt > OWNER_SILENCE_MS) clearMirror();
  }, 1000);
}

function schedulePublish(): void {
  if (!supported() || role !== "owner" || !handlers?.shouldParticipate()) return;
  window.clearTimeout(publishTimer);
  publishTimer = window.setTimeout(() => {
    touchOwner();
    post({
      type: "sync",
      tabId,
      at: Date.now(),
      activity: localActivity,
      runtime: activityRuntimeStore.snapshot(),
    });
  }, 40);
}

function yieldOwner(): void {
  ownClaim = null;
  localActivity = null;
  setRole("mirror");
}

function handleMessage(raw: MessageEvent<SyncMessage>): void {
  const message = raw.data;
  if (!message || message.tabId === tabId) return;

  switch (message.type) {
    case "hello":
      if (role === "owner" && handlers?.shouldParticipate()) {
        post({
          type: "sync",
          tabId,
          at: Date.now(),
          activity: localActivity,
          runtime: activityRuntimeStore.snapshot(),
        });
      }
      break;
    case "claim":
      remoteClaim = { tabId: message.tabId, at: message.at };
      if (role === "owner" && ownClaim && !beatsClaim(ownClaim, remoteClaim)) {
        yieldOwner();
        applyMirror(message.activity, null);
      }
      break;
    case "sync":
      touchOwner();
      ownerTabId = message.tabId;
      if (role === "owner" && ownClaim && beatsClaim(ownClaim, { tabId: message.tabId, at: message.at })) {
        return;
      }
      applyMirror(message.activity, message.runtime);
      resetSilenceWatch();
      break;
    case "state":
      if (role === "mirror") handlers?.onRemoteState(message.state);
      break;
    case "stop":
      if (role === "owner") handlers?.onRemoteStop();
      break;
    case "idle":
      if (role === "mirror" && ownerTabId === message.tabId) clearMirror();
      break;
    case "notice":
      handlers?.onRemoteNotice({
        text: message.text,
        ok: message.ok,
        source: message.source,
        dot: message.dot,
        id: message.id,
      });
      break;
  }
}

export const activitySync = {
  subscribe(listener: () => void): () => void {
    roleListeners.add(listener);
    return () => roleListeners.delete(listener);
  },

  role(): SyncRole {
    return role;
  },

  init(next: Handlers): () => void {
    handlers = next;
    if (!supported()) return () => undefined;

    tabId = getTabId();
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener("message", handleMessage);
    post({ type: "hello", tabId });
    resetSilenceWatch();

    const offRuntime = activityRuntimeStore.subscribe(schedulePublish);

    const onHide = () => {
      if (role === "owner" && handlers?.shouldParticipate()) post({ type: "idle", tabId });
    };
    window.addEventListener("pagehide", onHide);

    return () => {
      window.removeEventListener("pagehide", onHide);
      offRuntime();
      window.clearInterval(silenceTimer);
      window.clearTimeout(publishTimer);
      channel?.removeEventListener("message", handleMessage);
      channel?.close();
      channel = null;
      handlers = null;
      setRole("idle");
    };
  },

  async handshake(serverActivity: Activity | null | undefined): Promise<void> {
    if (!supported()) {
      localActivity = serverActivity ?? null;
      if (serverActivity) setRole("owner");
      return;
    }
    handshaking = true;
    post({ type: "hello", tabId });
    if (serverActivity && handlers?.shouldParticipate()) {
      const claim: Claim = { tabId, at: 0 };
      ownClaim = claim;
      setRole("owner");
      localActivity = serverActivity;
      post({ type: "claim", tabId, at: claim.at, activity: serverActivity });
    }
    await new Promise((resolve) => window.setTimeout(resolve, HANDSHAKE_MS));
    handshaking = false;

    if (role === "mirror") {
      localActivity = null;
      ownClaim = null;
      return;
    }

    if (serverActivity && ownClaim) {
      if (remoteClaim && !beatsClaim(ownClaim, remoteClaim)) {
        yieldOwner();
        localActivity = null;
        return;
      }
      schedulePublish();
      return;
    }

    if (serverActivity) {
      setRole("owner");
      ownClaim = { tabId, at: 0 };
      localActivity = serverActivity;
      schedulePublish();
    }
  },

  trackLocalActivity(activity: Activity | null): void {
    localActivity = activity;
  },

  isOwner(): boolean {
    return role === "owner";
  },

  isMirroring(): boolean {
    return role === "mirror";
  },

  isHandshaking(): boolean {
    return handshaking;
  },

  tryClaim(activity: Activity): boolean {
    if (!supported()) {
      setRole("owner");
      localActivity = activity;
      return true;
    }
    if (!handlers?.shouldParticipate()) return false;

    const claim: Claim = { tabId, at: Date.now() };
    ownClaim = claim;
    setRole("owner");
    localActivity = activity;
    activityMirrorStore.clear();
    post({ type: "claim", tabId, at: claim.at, activity });

    if (remoteClaim && !beatsClaim(claim, remoteClaim)) {
      yieldOwner();
      return false;
    }
    schedulePublish();
    return true;
  },

  publish(activity: Activity | null, runtime: ActivityRuntimeSnapshot | null): void {
    if (!supported() || role !== "owner" || !handlers?.shouldParticipate()) return;
    localActivity = activity;
    touchOwner();
    post({ type: "sync", tabId, at: Date.now(), activity, runtime });
  },

  publishState(state: GameState): void {
    if (!supported() || role !== "owner" || !handlers?.shouldParticipate()) return;
    post({ type: "state", tabId, state });
  },

  requestStop(): void {
    if (!supported() || role !== "mirror") return;
    post({ type: "stop", tabId, from: tabId });
  },

  release(): void {
    if (!supported()) return;
    if (role === "owner" && handlers?.shouldParticipate()) post({ type: "idle", tabId });
    ownClaim = null;
    localActivity = null;
    setRole("idle");
  },

  publishNotice(payload: {
    text: string;
    ok: boolean;
    source: string;
    dot?: PresenceStatus;
    id: number;
  }): void {
    if (!supported()) return;
    post({ type: "notice", tabId, ...payload });
  },
};
