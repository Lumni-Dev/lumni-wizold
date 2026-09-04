"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { findItem } from "@/models/data/items";
import type { Activity } from "@/models/entities/activity";
import type { AutomationKey } from "@/models/entities/automation";
import { isVip } from "@/models/rules/vip";
import type { EquipmentSlot } from "@/models/entities/item";
import { initialState, type GameState } from "@/models/entities/game-state";
import type { Character, Gender } from "@/models/entities/character";
import type { Pet, PetGender } from "@/models/entities/pet";
import type { PackInvite } from "@/models/entities/pack";
import type { PresenceStatus } from "@/models/entities/presence";
import { moonRepository } from "@/models/repositories/moon.repository";
import {
  clearActivityResume,
  mergeActivityResume,
  stashActivityResume,
} from "@/models/repositories/activity-resume.repository";
import { potionFuryRemainingMs, type MoonState } from "@/models/rules/moon";
import {
  AUTOMATION_TICK_MS,
  CYCLE_OPTOUT_SECS,
  HUNT_TICK_MS,
  PET_EXERCISE_ID,
  REST_TICK_MS,
} from "@/shared/constants/game";
import { GAME_VERSION, VERSION_POLL_MS } from "@/shared/constants/version";
import { formatReais } from "@/shared/utils/format";
import { petLevelOf, petMaxEnergy } from "@/models/rules/pet";
import { deriveStats, type DerivedStats } from "@/models/rules/stats";
import type { BirthDate } from "@/shared/utils/birth";
import type { TavernIdentity } from "@/models/entities/tavern";
import type { HuntAttempt, HuntReport } from "./hunt.controller";
import type { ArenaResolution } from "./arena.controller";
import type { TrainingReport } from "./training.controller";
import * as automationController from "./automation.controller";
import { ActivityEngine } from "./activity-engine";
import { activityMirrorStore } from "./activity-mirror.store";
import {
  activityRuntimeStore,
  armRestClock,
  clearRestClock,
  patchActivityRuntime,
} from "./activity-runtime";
import { activitySync } from "./activity-sync";
import { activityApi, activityQueuedApi, activitySlotRoute, activityThreadBusy, flushActivityKeepalive } from "./activity-thread";
import { api, isTransientApiMessage, type ApiAnswer } from "./api.client";
import { bindAutomationPulse } from "./automation-pulse";
import { usePresenceHeartbeat } from "./use-presence-heartbeat";
import { playSound, preloadSounds, setVoiceProfile } from "./sound";
export interface Notice {
  id: number;
  text: string;
  ok: boolean;
  source: string;
  at: number;
  dot?: PresenceStatus;
}
export type { Activity };
interface GameContextValue {
  ready: boolean;
  authenticated: boolean;
  state: GameState;
  character: Character | null;
  pet: Pet | null;
  stats: DerivedStats | null;
  moon: MoonState;
  notices: Notice[];
  dismissNotice: (id: number) => void;
  notify: (
    text: string,
    ok: boolean,
    source: string,
    dot?: PresenceStatus,
    local?: boolean,
  ) => void;
  enter: (
    credential: string,
    birth: BirthDate,
  ) => Promise<{
    hasCharacter: boolean;
    needsTwoFactor?: boolean;
  } | null>;
  verifyTwoFactor: (code: string) => Promise<{ hasCharacter: boolean } | null>;
  resendTwoFactor: () => Promise<boolean>;
  sendTwoFactorCode: (action: "enable" | "disable") => Promise<boolean>;
  enableTwoFactor: (code: string) => Promise<boolean>;
  disableTwoFactor: (code: string) => Promise<boolean>;
  startRun: (name: string, gender: Gender) => Promise<boolean>;
  renameCharacter: (name: string) => Promise<boolean>;
  requestDeleteCode: () => Promise<boolean>;
  deleteRun: (code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  logoutEverywhere: () => Promise<void>;
  rest: () => Promise<void>;
  activity: Activity | null;
  setActivity: (activity: Activity | null) => void;
  syncProgress: (patch: { beat: number; cooldownUntil?: string | null; laps?: number }) => void;
  persistActivity: (activity: Activity | null) => void;
  train: (exerciseId: string) => Promise<{ message: string; raised: boolean } | "retry" | null>;
  hunt: (territoryId: string, creatureId?: string) => Promise<HuntAttempt>;
  landHunt: () => void;
  sufferBlow: (damage: number) => void;
  drawOpponent: () => Promise<{
    hunterId: string;
    name: string;
  } | null>;
  challengeArena: (hunterId: string) => Promise<ArenaResolution | null>;
  landArena: () => void;
  equipItem: (itemId: string, enhancement?: number) => Promise<void>;
  unequipItem: (slot: EquipmentSlot) => Promise<void>;
  consumeItem: (itemId: string) => Promise<void>;
  buyItem: (itemId: string, quantity?: number) => Promise<void>;
  sellItem: (itemId: string, quantity?: number, enhancement?: number) => Promise<void>;
  announceListing: (
    itemId: string,
    quantity: number,
    priceCents: number,
    enhancement?: number,
  ) => Promise<boolean>;
  cancelListing: (listingId: string) => Promise<void>;
  purchaseListing: (listingId: string, quantity: number) => Promise<boolean>;
  requestWithdraw: (pixKey: string, fullName: string, cpf: string) => Promise<boolean>;
  buyPack: (packId: string) => Promise<boolean>;
  buyVip: () => Promise<boolean>;
  cancelVip: () => Promise<boolean>;
  reactivateVip: () => Promise<boolean>;
  confirmPayment: (sessionId: string) => Promise<boolean>;
  mine: (oreId: string) => Promise<boolean | "retry">;
  enhance: (
    itemId: string,
    enhancement?: number,
  ) => Promise<{ message: string; raised: boolean } | "retry" | null>;
  adoptPet: (gender: PetGender, name: string) => Promise<void>;
  releasePet: () => Promise<void>;
  setAutomation: (key: AutomationKey, on: boolean) => void;
  invite: (person: TavernIdentity) => Promise<boolean>;
  inviteByNick: (nick: string) => Promise<boolean>;
  acceptInvite: (id: string) => Promise<boolean>;
  declineInvite: (id: string) => Promise<boolean>;
  fetchInvites: () => Promise<PackInvite[] | null>;
  removeFromPack: (id: string) => Promise<void>;
  renamePet: (name: string) => Promise<boolean>;
  feedPet: (itemId: string) => Promise<void>;
  setPetActive: (active: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  tutorial: boolean;
  completeTutorial: () => Promise<boolean>;
  updateAvailable: boolean;
  updateVersion: string | null;
  applyUpdate: () => void;
}
const GameContext = createContext<GameContextValue | null>(null);
function subscribeToClient() {
  return () => undefined;
}
interface HeldLanding {
  state: GameState;
  seq: number;
  report: HuntReport | null;
  at: number;
}
const HELD_LANDING_TTL_MS = 30000;

function activityPayload(next: Activity | null): Record<string, unknown> | { kind: null } {
  if (!next) return { kind: null };
  return {
    kind: next.kind,
    id: next.id ?? null,
    enhancement: next.enhancement ?? null,
    paused: next.paused ?? false,
    beat: next.beat ?? 0,
    laps: next.laps ?? 0,
    cooldownUntil: next.cooldownUntil ?? null,
    resume: next.resume ?? null,
  };
}

function replayOverlay(incoming: GameState, live: GameState): GameState {
  if (!incoming.character || !live.character) return incoming;
  return {
    ...incoming,
    character: { ...incoming.character, health: live.character.health },
  };
}

function landingIsStale(held: GameState, incoming: GameState): boolean {
  const a = held.character;
  const b = incoming.character;
  if (!a || !b) return false;
  return (
    b.hunts < a.hunts ||
    b.wins < a.wins ||
    b.losses < a.losses ||
    b.arenaWins < a.arenaWins ||
    b.arenaLosses < a.arenaLosses
  );
}

export function GameProvider({ children }: { children: ReactNode }) {
  const hydrated = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false,
  );
  const [state, setState] = useState<GameState>(initialState());
  const [booted, setBooted] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [tutorial, setTutorial] = useState(true);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [activity, setActivityState] = useState<Activity | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [furyNow, setFuryNow] = useState(0);
  const noticeCounter = useRef(0);
  const NOTICE_STACK = 4;
  const NOTICE_DURATION_MS = 4000;
  const ready = hydrated && booted;
  const moon = useSyncExternalStore(
    moonRepository.subscribe,
    moonRepository.snapshot,
    moonRepository.serverSnapshot,
  );
  const furyUntil = state.character?.furyUntil ?? "";
  useEffect(() => {
    if (!furyUntil) return undefined;
    const left = potionFuryRemainingMs({ furyUntil });
    if (left <= 0) return undefined;
    const timer = window.setTimeout(() => setFuryNow(Date.now()), left + 50);
    return () => window.clearTimeout(timer);
  }, [furyUntil]);
  const pushNotice = useCallback(
    (text: string, ok: boolean, source: string, dot: PresenceStatus | undefined, sound: boolean) => {
      noticeCounter.current += 1;
      const line = { id: noticeCounter.current, text, ok, source, dot, at: Date.now() };
      setNotices((current) => [...current, line].slice(-NOTICE_STACK));
      if (!ok && sound) playSound("denied");
      return line.id;
    },
    [],
  );
  const announce = useCallback(
    (text: string, ok: boolean, source: string, dot?: PresenceStatus, local = false) => {
      const id = pushNotice(text, ok, source, dot, !local);
      if (!local) activitySync.publishNotice({ text, ok, source, dot, id });
    },
    [pushNotice],
  );
  const dismissNotice = useCallback((id: number) => {
    setNotices((current) => current.filter((line) => line.id !== id));
  }, []);
  useEffect(() => {
    const oldest = notices[0];
    if (!oldest) return;
    const left = oldest.at + NOTICE_DURATION_MS - Date.now();
    const timer = window.setTimeout(() => dismissNotice(oldest.id), Math.max(0, left));
    return () => window.clearTimeout(timer);
  }, [notices, dismissNotice]);
  useEffect(() => {
    let alive = true;
    const check = async () => {
      const answer = await api("GET", "/api/version");
      if (alive && answer.version && answer.version !== GAME_VERSION) {
        setUpdateVersion(answer.version);
        setUpdateAvailable(true);
      }
    };
    void check();
    const timer = window.setInterval(() => void check(), VERSION_POLL_MS);
    const recheck = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", recheck);
    window.addEventListener("focus", recheck);
    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", recheck);
      window.removeEventListener("focus", recheck);
    };
  }, []);
  useEffect(() => {
    preloadSounds();
  }, []);
  usePresenceHeartbeat(authenticated && state.character !== null);
  const lineage = state.character?.gender ?? "male";
  useEffect(() => {
    setVoiceProfile(lineage);
  }, [lineage]);
  const stateRef = useRef(state);
  const activityRef = useRef(activity);
  useEffect(() => {
    stateRef.current = state;
    activityRef.current = activity;
  }, [state, activity]);
  const mintRef = useRef(0);
  const appliedRef = useRef(0);
  const heldHuntRef = useRef<HeldLanding | null>(null);
  const heldArenaRef = useRef<HeldLanding | null>(null);
  const inFlightRef = useRef(0);
  const resumeBootRef = useRef(true);
  const progressFlushRef = useRef<number | null>(null);
  const pendingProgressRef = useRef<{
    beat: number;
    cooldownUntil?: string | null;
    laps?: number;
  } | null>(null);
  const adoptActivityFromServer = useCallback((next: Activity | null | undefined) => {
    if (next === undefined) return;
    if (activitySync.isMirroring() || activityMirrorStore.isMirroring()) return;
    if (activitySync.isHandshaking()) return;
    if (heldHuntRef.current || heldArenaRef.current) return;
    if (inFlightRef.current > 0) return;
    if (activityThreadBusy()) return;
    let merged = next === null ? null : mergeActivityResume(next);
    if (
      resumeBootRef.current &&
      merged?.kind === "hunt" &&
      (merged.beat ?? 0) > 0 &&
      !merged.cooldownUntil
    ) {
      merged = {
        ...merged,
        beat: 0,
        cooldownUntil: new Date(Date.now() + CYCLE_OPTOUT_SECS * 1000).toISOString(),
      };
      stashActivityResume(merged);
    }
    if (resumeBootRef.current) resumeBootRef.current = false;
    const local = activityRef.current;
    if (local && merged && local.kind === merged.kind && (local.id ?? null) === (merged.id ?? null)) {
      if ((merged.beat ?? 0) < (local.beat ?? 0)) return;
    }
    if (local && local.kind !== "rest") {
      const dock = activityRuntimeStore.snapshot().dock;
      if (dock && local.kind === dock.kind && !local.paused && !dock.canStop) return;
    }
    activityRef.current = merged;
    if (merged) activitySync.trackLocalActivity(merged);
    else activitySync.trackLocalActivity(null);
    setActivityState(merged);
  }, []);
  const adoptState = useCallback((next: GameState, seq: number) => {
    if (seq <= appliedRef.current) return;
    appliedRef.current = seq;
    setState(next);
  }, []);
  const applyState = useCallback(
    (next: GameState, seq: number) => {
      adoptState(next, seq);
      activitySync.publishState(next);
    },
    [adoptState],
  );
  const setActivityRef = useRef<(next: Activity | null, fromServer?: boolean) => void>(() => undefined);
  const flushProgress = useCallback((keepalive = false) => {
    if (progressFlushRef.current) {
      window.clearTimeout(progressFlushRef.current);
      progressFlushRef.current = null;
    }
    const patch = pendingProgressRef.current;
    if (!patch || activitySync.isMirroring()) return;
    pendingProgressRef.current = null;
    if (keepalive) {
      flushActivityKeepalive("PATCH", "/api/activity/progress", patch);
    } else {
      void activityApi("PATCH", "/api/activity/progress", patch);
    }
  }, []);
  const flushBeforeUnload = useCallback(() => {
    flushProgress(true);
    const act = activityRef.current;
    if (act?.kind === "rest") {
      flushActivityKeepalive("PATCH", "/api/character/rest", {});
    } else if (act) {
      stashActivityResume(act);
    }
  }, [flushProgress]);
  const applyUpdate = useCallback(() => {
    flushBeforeUnload();
    if (activitySync.isOwner()) activitySync.release();
    const reload = () => window.location.reload();
    try {
      if (typeof caches !== "undefined") {
        void caches
          .keys()
          .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
          .then(reload, reload);
        return;
      }
    } catch {}
    reload();
  }, [flushBeforeUnload]);
  const syncProgress = useCallback(
    (patch: { beat: number; cooldownUntil?: string | null; laps?: number }) => {
      if (activitySync.isMirroring()) return;
      const current = activityRef.current;
      if (!current) return;
      const next: Activity = { ...current };
      if (patch.beat > 0) next.beat = patch.beat;
      else delete next.beat;
      if (patch.laps !== undefined) {
        if (patch.laps > 0) next.laps = patch.laps;
        else delete next.laps;
      }
      if (patch.cooldownUntil) next.cooldownUntil = patch.cooldownUntil;
      else delete next.cooldownUntil;
      activityRef.current = next;
      activitySync.trackLocalActivity(next);
      stashActivityResume(next);
      pendingProgressRef.current = patch;
      const boundary =
        patch.beat === 0 || (patch.cooldownUntil !== undefined && patch.cooldownUntil !== null);
      if (boundary) {
        flushProgress();
        return;
      }
      if (progressFlushRef.current) window.clearTimeout(progressFlushRef.current);
      progressFlushRef.current = window.setTimeout(flushProgress, 3000);
    },
    [flushProgress],
  );
  const automationBeatRef = useRef<() => void>(() => {});
  const lastFuryDrinkRef = useRef(0);
  const setActivity = useCallback(
    (next: Activity | null, fromServer = false) => {
      if (!fromServer && activitySync.isMirroring()) {
        if (next === null) activitySync.requestStop();
        return;
      }
      if (!fromServer && next !== null) {
        if (typeof window !== "undefined" && window.location.pathname === "/") return;
        if (!activitySync.tryClaim(next)) return;
      }
      const prev = activityRef.current;
      if (prev?.kind === "hunt" && (next?.kind !== "hunt" || next.id !== prev.id)) {
        const held = heldHuntRef.current;
        if (held) {
          heldHuntRef.current = null;
          applyState(held.state, held.seq);
        }
      }
      activityRef.current = next;
      activitySync.trackLocalActivity(next);
      setActivityState(next);
      if (next === null) clearActivityResume();
      else stashActivityResume(next);
      if (fromServer) return;
      if (next === null) {
        flushProgress();
        activitySync.release();
      }
      void activityApi("PUT", "/api/activity", activityPayload(next));
      if (next?.kind === "hunt") {
        window.setTimeout(() => automationBeatRef.current(), 0);
      }
    },
    [applyState, flushProgress],
  );
  useEffect(() => {
    setActivityRef.current = setActivity;
  }, [setActivity]);
  const persistActivity = useCallback((next: Activity | null) => {
    activityRef.current = next;
    void activityApi("PUT", "/api/activity", activityPayload(next));
  }, []);
  const request = useCallback(
    async <T,>(
      method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
      path: string,
      body?: unknown,
      defer?: "hunt" | "arena",
    ): Promise<ApiAnswer<T>> => {
      for (const ref of [heldHuntRef, heldArenaRef]) {
        const held = ref.current;
        if (held && Date.now() - held.at > HELD_LANDING_TTL_MS) {
          ref.current = null;
          applyState(held.state, held.seq);
        }
      }
      if (defer) inFlightRef.current += 1;
      try {
        const call = activitySlotRoute(method, path) ? activityQueuedApi<T> : api<T>;
        const answer = await call(method, path, body);
        if (answer.status === 401) {
          setAuthenticated(false);
          setTutorial(true);
          return answer;
        }
        if (typeof answer.tutorial === "boolean") setTutorial(answer.tutorial);
        if (answer.state) {
          const seq = ++mintRef.current;
          const incoming = answer.state;
          if (defer === "hunt" && answer.ok) {
            heldHuntRef.current = {
              state: incoming,
              seq,
              report: answer.data as HuntReport,
              at: Date.now(),
            };
          } else if (defer === "arena" && answer.ok) {
            heldArenaRef.current = { state: incoming, seq, report: null, at: Date.now() };
          } else if (heldHuntRef.current) {
            if (!landingIsStale(heldHuntRef.current.state, incoming)) {
              heldHuntRef.current = { ...heldHuntRef.current, state: incoming, seq };
              setState((current) => replayOverlay(incoming, current));
            }
          } else if (heldArenaRef.current) {
            if (!landingIsStale(heldArenaRef.current.state, incoming)) {
              heldArenaRef.current = { ...heldArenaRef.current, state: incoming, seq };
              setState((current) => replayOverlay(incoming, current));
            }
          } else {
            applyState(incoming, seq);
          }
        }
        adoptActivityFromServer(answer.activity);
        return answer;
      } finally {
        if (defer) inFlightRef.current -= 1;
      }
    },
    [applyState, adoptActivityFromServer],
  );
  const act = useCallback(
    async <T,>(
      method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
      path: string,
      body: unknown,
      source: string,
      celebrate?: (data: T | null) => void,
    ): Promise<ApiAnswer<T>> => {
      const answer = await request<T>(method, path, body);
      if (answer.message) announce(answer.message, answer.ok, source);
      if (answer.ok) celebrate?.(answer.data);
      return answer;
    },
    [request, announce],
  );
  const beginRest = useCallback(async () => {
    if (activitySync.isMirroring() || activityMirrorStore.isMirroring()) return;
    const interrupted = activityRef.current;
    const resume =
      interrupted && interrupted.kind !== "rest"
        ? {
            kind: interrupted.kind,
            id: interrupted.id,
            enhancement: interrupted.enhancement,
          }
        : undefined;
    setActivity({ kind: "rest", resume }, true);
    armRestClock(REST_TICK_MS);
    const answer = await act(
      "POST",
      "/api/character/rest",
      { resume },
      "Recuperação",
      () => playSound("rest"),
    );
    if (!answer.ok) {
      clearRestClock();
      setActivity(interrupted ?? null, true);
    }
  }, [act, setActivity]);
  useEffect(() => {
    if (!hydrated) return;
    return activitySync.init({
      shouldParticipate: () =>
        typeof window !== "undefined" && window.location.pathname !== "/",
      onRemoteStop: () => setActivityRef.current(null),
      onRemoteState: (next) => {
        if (!activitySync.isMirroring()) return;
        setState(next);
      },
      onRemoteNotice: (payload) => {
        pushNotice(payload.text, payload.ok, payload.source, payload.dot, false);
      },
    });
  }, [hydrated, adoptState, pushNotice]);
  useEffect(() => {
    if (!hydrated) return;
    void (async () => {
      const answer = await api("POST", "/api/state");
      if (answer.status !== 401) setAuthenticated(true);
      if (typeof answer.tutorial === "boolean") setTutorial(answer.tutorial);
      if (answer.state) applyState(answer.state, ++mintRef.current);
      await activitySync.handshake(answer.activity);
      if (!activitySync.isMirroring()) adoptActivityFromServer(answer.activity);
      setBooted(true);
    })();
  }, [hydrated, applyState, adoptActivityFromServer]);
  useEffect(() => {
    if (!ready) return undefined;
    let timer = 0;
    const sync = () => {
      if (document.visibilityState !== "visible") return;
      window.clearTimeout(timer);
      timer = window.setTimeout(async () => {
        if (activitySync.isOwner()) return;
        const answer = await request("POST", "/api/state");
        if (answer.activity && !activitySync.isOwner() && !activitySync.isMirroring()) {
          await activitySync.reclaim(answer.activity);
        }
        if (!activitySync.isMirroring()) adoptActivityFromServer(answer.activity);
      }, 600);
    };
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
    };
  }, [ready, request, adoptActivityFromServer]);
  useEffect(() => {
    if (!ready) return undefined;
    const onHide = () => {
      if (document.visibilityState === "hidden") flushBeforeUnload();
    };
    const onPageHide = (event: PageTransitionEvent) => {
      flushBeforeUnload();
      if (!event.persisted && activitySync.isOwner()) activitySync.release();
    };
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [ready, flushBeforeUnload]);
  const petResting =
    state.pet !== null &&
    state.pet.active === false &&
    state.pet.energy < petMaxEnergy(petLevelOf(state.pet));
  useEffect(() => {
    if (!ready || !petResting) return;
    const collect = () =>
      void act<{
        whole: boolean;
      }>("POST", "/api/pet/rest-collect", undefined, "Mascote");
    collect();
    const timer = window.setInterval(collect, REST_TICK_MS);
    return () => window.clearInterval(timer);
  }, [ready, petResting, act]);
  const resting = activity?.kind === "rest";
  useEffect(() => {
    if (!ready || !resting) return;
    let alive = true;
    let timer = 0;
    let inflight = false;

    const schedule = (ms: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void collect(), Math.max(250, ms));
    };

    const collect = async () => {
      if (!alive || inflight) return;
      inflight = true;
      try {
        const answer = await request<{
          done: boolean;
          ticks: number;
          healed?: number;
          nextInMs?: number;
        }>("PATCH", "/api/character/rest");
        if (!alive) return;
        if (!answer.ok) {
          if (
            answer.status === 0 ||
            answer.status === 429 ||
            answer.status >= 500 ||
            isTransientApiMessage(answer.message)
          ) {
            armRestClock(REST_TICK_MS);
            schedule(REST_TICK_MS);
            return;
          }
          setActivity(null);
          return;
        }
        const ticks = answer.data?.ticks ?? 0;
        const healed = answer.data?.healed ?? 0;
        if (ticks > 0) playSound("rest");
        if (healed > 0) {
          const at = Date.now();
          patchActivityRuntime({ restHealed: { amount: healed, at } });
          window.setTimeout(() => {
            if (activityRuntimeStore.snapshot().restHealed?.at === at) {
              patchActivityRuntime({ restHealed: null });
            }
          }, 2500);
        }
        if (answer.data?.done) {
          clearRestClock();
          setActivity(automationController.resumeAfterRest(stateRef.current, activityRef.current));
          return;
        }
        const wait = answer.data?.nextInMs ?? REST_TICK_MS;
        armRestClock(wait);
        schedule(wait);
      } finally {
        inflight = false;
      }
    };

    void collect();
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [ready, resting, request, setActivity, announce]);
  useEffect(() => {
    if (!ready) return;
    let busy = false;
    const beat = async () => {
      if (busy) return;
      if (activitySync.isMirroring()) return;
      if (inFlightRef.current > 0 || heldHuntRef.current || heldArenaRef.current) return;
      if (activityThreadBusy()) return;
      if (!isVip(stateRef.current.character, Date.now())) return;
      busy = true;
      try {
        const step = automationController.nextAutomationStep(stateRef.current, activityRef.current);
        if (!step) return;
        switch (step.kind) {
          case "potion": {
            const furyMinutes = findItem(step.itemId)?.effect.furyMinutes ?? 0;
            if (furyMinutes > 0 && Date.now() - lastFuryDrinkRef.current < furyMinutes * 60000) {
              return;
            }
            const drank = await act(
              "POST",
              "/api/inventory/consume",
              { itemId: step.itemId },
              "Inventário",
              () => playSound("potion"),
            );
            if (furyMinutes > 0 && drank.ok) lastFuryDrinkRef.current = Date.now();
            return;
          }
          case "rest":
            await beginRest();
            return;
          case "feed":
            await act("POST", "/api/pet/feed", { itemId: step.itemId }, "Mascote", () =>
              playSound("pet-eat"),
            );
            return;
          case "kennel":
            await act("POST", "/api/pet/active", { active: step.active }, "Mascote", () =>
              playSound(step.active ? "pet-along" : "pet-rest"),
            );
            return;
          case "work":
            setActivity(step.activity);
            return;
        }
      } finally {
        busy = false;
      }
    };
    automationBeatRef.current = () => void beat();
    const stopPulse = bindAutomationPulse(() => void beat());
    const timer = window.setInterval(() => void beat(), AUTOMATION_TICK_MS);
    return () => {
      automationBeatRef.current = () => {};
      stopPulse();
      window.clearInterval(timer);
    };
  }, [ready, act, beginRest, setActivity]);
  useEffect(() => {
    if (!ready || !authenticated) return;
    const settle = async () => {
      const before = stateRef.current.wallet.cents;
      const answer = await request("POST", "/api/state");
      const after = answer.state?.wallet.cents ?? before;
      if (answer.ok && after > before) {
        announce(
          "O Alforje recebeu " + formatReais(after - before) + " de vendas no bazar.",
          true,
          "Bazar",
        );
        playSound("sell");
      }
    };
    const timer = window.setInterval(() => void settle(), 60000);
    return () => window.clearInterval(timer);
  }, [ready, authenticated, request, announce]);
  const value = useMemo<GameContextValue>(() => {
    const stats = state.character
      ? deriveStats(
          state.character,
          state.equipment,
          state.pet,
          moon.phase.key,
          furyNow > 0 ? furyNow : undefined,
        )
      : null;
    const character =
      state.character && stats
        ? {
            ...state.character,
            health: Math.min(state.character.health, stats.maxHealth),
          }
        : state.character;
    return {
      ready,
      authenticated,
      state,
      character,
      pet: state.pet,
      stats,
      moon,
      notices,
      dismissNotice,
      notify: announce,
      enter: async (credential, birth) => {
        const answer = await api<{
          hasCharacter: boolean;
          needsTwoFactor?: boolean;
          tutorial?: boolean;
        }>("POST", "/api/auth/enter", {
          credential,
          birth,
        });
        if (!answer.ok) {
          announce(answer.message, false, "Conta");
          return null;
        }
        if (typeof answer.data?.tutorial === "boolean") setTutorial(answer.data.tutorial);
        if (answer.data?.needsTwoFactor) {
          announce(answer.message, true, "Conta");
          return {
            hasCharacter: answer.data.hasCharacter === true,
            needsTwoFactor: true,
          };
        }
        setAuthenticated(true);
        announce(answer.message, true, "Conta");
        await request("POST", "/api/state");
        return { hasCharacter: answer.data?.hasCharacter === true };
      },
      verifyTwoFactor: async (code) => {
        const answer = await api<{ hasCharacter: boolean }>("POST", "/api/auth/two-factor/verify", {
          code,
        });
        if (!answer.ok) {
          announce(answer.message, false, "Conta");
          return null;
        }
        setAuthenticated(true);
        announce(answer.message, true, "Conta");
        await request("POST", "/api/state");
        return { hasCharacter: answer.data?.hasCharacter === true };
      },
      resendTwoFactor: async () => {
        const answer = await api("POST", "/api/auth/two-factor/resend");
        announce(answer.message, answer.ok, "Conta");
        return answer.ok;
      },
      sendTwoFactorCode: async (action) => {
        const answer = await act("POST", "/api/auth/two-factor/send", { action }, "Conta");
        return answer.ok;
      },
      enableTwoFactor: async (code) => {
        const answer = await act("POST", "/api/auth/two-factor/enable", { code }, "Conta");
        return answer.ok;
      },
      disableTwoFactor: async (code) => {
        const answer = await act("POST", "/api/auth/two-factor/disable", { code }, "Conta");
        return answer.ok;
      },
      startRun: async (name, gender) => {
        const answer = await act("POST", "/api/characters", { name, gender }, "Personagem", () =>
          playSound("transform"),
        );
        if (answer.ok) await request("POST", "/api/state");
        return answer.ok;
      },
      renameCharacter: async (name) => {
        const answer = await act("POST", "/api/character/rename", { name }, "Personagem");
        return answer.ok;
      },
      requestDeleteCode: async () => {
        const answer = await act("POST", "/api/characters/delete-code", undefined, "Conta");
        return answer.ok;
      },
      logout: async () => {
        await api("POST", "/api/auth/logout");
        heldHuntRef.current = null;
        heldArenaRef.current = null;
        applyState(initialState(), ++mintRef.current);
        setActivity(null);
        setAuthenticated(false);
        setTutorial(true);
      },
      logoutEverywhere: async () => {
        await api("POST", "/api/auth/logout-all");
        heldHuntRef.current = null;
        heldArenaRef.current = null;
        applyState(initialState(), ++mintRef.current);
        setActivity(null);
        setAuthenticated(false);
        setTutorial(true);
      },
      deleteRun: async (code) => {
        const answer = await api("DELETE", "/api/characters", { code });
        announce(answer.message, answer.ok, "Conta");
        if (answer.ok) {
          applyState(initialState(), ++mintRef.current);
          setActivity(null);
          setAuthenticated(false);
          setTutorial(true);
        }
        return answer.ok;
      },
      rest: beginRest,
      activity,
      setActivity,
      syncProgress,
      persistActivity,
      train: async (exerciseId) => {
        if (exerciseId === PET_EXERCISE_ID) {
          const answer = await request<{ leveled: boolean }>("POST", "/api/training/pet");
          if (!answer.ok) {
            if (isTransientApiMessage(answer.message)) return "retry";
            if (answer.message) announce(answer.message, false, "Treino");
            return null;
          }
          return { message: answer.message, raised: answer.data?.leveled === true };
        }
        const answer = await request<TrainingReport>("POST", "/api/training/session", {
          exerciseId,
        });
        if (!answer.ok) {
          if (isTransientApiMessage(answer.message)) return "retry";
          if (answer.message) announce(answer.message, false, "Treino");
          return null;
        }
        return { message: answer.message, raised: answer.data?.attributeRaised === true };
      },
      hunt: async (territoryId, creatureId) => {
        const answer = await request<HuntReport | { retryAfterMs: number }>(
          "POST",
          "/api/hunt",
          { territoryId, creatureId },
          "hunt",
        );
        if (answer.ok && answer.data && "combat" in answer.data) {
          return { kind: "fight", report: answer.data };
        }
        const retryAfterMs =
          answer.data &&
          "retryAfterMs" in answer.data &&
          typeof answer.data.retryAfterMs === "number"
            ? answer.data.retryAfterMs
            : isTransientApiMessage(answer.message)
              ? HUNT_TICK_MS * 2
              : null;
        if (retryAfterMs !== null) {
          return { kind: "retry", retryAfterMs };
        }
        if (answer.message) announce(answer.message, false, "Caça");
        return { kind: "stop" };
      },
      landHunt: () => {
        const held = heldHuntRef.current;
        heldHuntRef.current = null;
        if (!held) return;
        applyState(held.state, held.seq);
      },
      sufferBlow: (damage) => {
        setState((current) => {
          if (!current.character) return current;
          const next = {
            ...current,
            character: {
              ...current.character,
              health: Math.max(1, current.character.health - Math.max(0, Math.round(damage))),
            },
          };
          activitySync.publishState(next);
          return next;
        });
      },
      drawOpponent: async () => {
        const answer = await request<{
          hunterId: string;
          name: string;
        }>("POST", "/api/arena/draw");
        if (!answer.ok && answer.message) announce(answer.message, false, "Arena");
        return answer.ok ? answer.data : null;
      },
      challengeArena: async (hunterId) => {
        const answer = await request<ArenaResolution>(
          "POST",
          "/api/arena/challenge",
          { hunterId },
          "arena",
        );
        if (!answer.ok) {
          if (answer.message) announce(answer.message, false, "Arena");
          return null;
        }
        return answer.data;
      },
      landArena: () => {
        const held = heldArenaRef.current;
        heldArenaRef.current = null;
        if (!held) return;
        applyState(held.state, held.seq);
      },
      equipItem: async (itemId, enhancement = 0) => {
        await act("POST", "/api/inventory/equip", { itemId, enhancement }, "Inventário", () =>
          playSound("equip"),
        );
      },
      unequipItem: async (slot) => {
        await act("POST", "/api/inventory/unequip", { slot }, "Inventário", () =>
          playSound("equip"),
        );
      },
      consumeItem: async (itemId) => {
        await act("POST", "/api/inventory/consume", { itemId }, "Inventário", () =>
          playSound(findItem(itemId)?.category === "pet" ? "pet-eat" : "potion"),
        );
      },
      buyItem: async (itemId, quantity = 1) => {
        await act("POST", "/api/market/buy", { itemId, quantity }, "Mercado", () =>
          playSound("buy"),
        );
      },
      sellItem: async (itemId, quantity = 1, enhancement = 0) => {
        await act("POST", "/api/market/sell", { itemId, quantity, enhancement }, "Mercado", () =>
          playSound("sell"),
        );
      },
      announceListing: async (itemId, quantity, priceCents, enhancement = 0) => {
        const answer = await act(
          "POST",
          "/api/bazaar/announce",
          { itemId, quantity, priceCents, enhancement },
          "Bazar",
          () => playSound("ui"),
        );
        return answer.ok;
      },
      cancelListing: async (listingId) => {
        await act("POST", "/api/bazaar/cancel", { listingId }, "Bazar", () => playSound("ui"));
      },
      purchaseListing: async (listingId, quantity) => {
        const answer = await act<{ url: string }>(
          "POST",
          "/api/bazaar/checkout",
          { listingId, quantity },
          "Bazar",
        );
        if (answer.ok && answer.data?.url) {
          window.location.assign(answer.data.url);
          return true;
        }
        return false;
      },
      requestWithdraw: async (pixKey, fullName, cpf) => {
        const answer = await act(
          "POST",
          "/api/bazaar/withdraw",
          { pixKey, fullName, cpf },
          "Bazar",
          () => playSound("sell"),
        );
        return answer.ok;
      },
      buyPack: async (packId) => {
        const answer = await act<{ url: string }>("POST", "/api/store/checkout", { packId }, "Loja");
        if (answer.ok && answer.data?.url) {
          window.location.assign(answer.data.url);
          return true;
        }
        return false;
      },
      buyVip: async () => {
        const answer = await act<{ url: string }>("POST", "/api/vip/checkout", undefined, "Loja");
        if (answer.ok && answer.data?.url) {
          window.location.assign(answer.data.url);
          return true;
        }
        return false;
      },
      cancelVip: async () => {
        const answer = await act("POST", "/api/vip/cancel", undefined, "Loja");
        return answer.ok;
      },
      reactivateVip: async () => {
        const answer = await act("POST", "/api/vip/reactivate", undefined, "Loja");
        return answer.ok;
      },
      confirmPayment: async (sessionId) => {
        const answer = await act("POST", "/api/stripe/confirm", { sessionId }, "Pagamento", () =>
          playSound("buy"),
        );
        return answer.ok;
      },
      mine: async (oreId) => {
        const answer = await request<{
          levelsGained: number;
        }>("POST", "/api/mine", { oreId });
        if (!answer.ok) {
          if (isTransientApiMessage(answer.message)) return "retry";
          if (answer.message) announce(answer.message, false, "Mina");
          return false;
        }
        if (answer.message) announce(answer.message, true, "Mina");
        if ((answer.data?.levelsGained ?? 0) > 0) playSound("vein", 220);
        return true;
      },
      enhance: async (itemId, enhancement = 0) => {
        const answer = await request<{ raised: boolean }>("POST", "/api/forge", {
          itemId,
          enhancement,
        });
        if (!answer.ok) {
          if (isTransientApiMessage(answer.message)) return "retry";
          if (answer.message) announce(answer.message, false, "Bigorna");
          return null;
        }
        return { message: answer.message, raised: answer.data?.raised === true };
      },
      adoptPet: async (gender, name) => {
        await act("POST", "/api/pet/adopt", { gender, name }, "Mascote", () => {
          playSound("buy");
          playSound("howl", 240);
        });
      },
      releasePet: async () => {
        await act("POST", "/api/pet/release", undefined, "Mascote", () => playSound("beast"));
      },
      setAutomation: (key, on) => {
        const previous = stateRef.current.automation[key];
        stateRef.current = {
          ...stateRef.current,
          automation: { ...stateRef.current.automation, [key]: on },
        };
        setState((current) => ({
          ...current,
          automation: { ...current.automation, [key]: on },
        }));
        playSound("ui");
        if (on) window.setTimeout(() => automationBeatRef.current(), 0);
        void api("PUT", "/api/automation", { key, on }).then((answer) => {
          if (!answer.ok) {
            stateRef.current = {
              ...stateRef.current,
              automation: { ...stateRef.current.automation, [key]: previous },
            };
            setState((current) => ({
              ...current,
              automation: { ...current.automation, [key]: previous },
            }));
            announce(answer.message, false, "Automação");
          }
        });
      },
      invite: async (person) => {
        const answer = await act(
          "POST",
          "/api/pack/invites",
          { id: person.id, name: person.name },
          "Matilha",
          () => playSound("chat"),
        );
        return answer.ok;
      },
      inviteByNick: async (nick) => {
        const answer = await act("POST", "/api/pack/invites", { nick }, "Matilha", () =>
          playSound("chat"),
        );
        return answer.ok;
      },
      acceptInvite: async (id) => {
        const answer = await act(
          "POST",
          "/api/pack/invites/" + encodeURIComponent(id) + "/accept",
          undefined,
          "Matilha",
          () => playSound("chat"),
        );
        return answer.ok;
      },
      declineInvite: async (id) => {
        const answer = await act(
          "POST",
          "/api/pack/invites/" + encodeURIComponent(id) + "/decline",
          undefined,
          "Matilha",
          () => playSound("discard"),
        );
        return answer.ok;
      },
      fetchInvites: async () => {
        const answer = await request<{ invites: PackInvite[] }>("GET", "/api/pack/invites");
        return answer.ok ? (answer.data?.invites ?? []) : null;
      },
      removeFromPack: async (id) => {
        await act("DELETE", "/api/pack/" + encodeURIComponent(id), undefined, "Matilha", () =>
          playSound("discard"),
        );
      },
      renamePet: async (name) => {
        const answer = await act("POST", "/api/pet/rename", { name }, "Mascote", () =>
          playSound("buy"),
        );
        return answer.ok;
      },
      feedPet: async (itemId) => {
        await act("POST", "/api/pet/feed", { itemId }, "Mascote", () => playSound("pet-eat"));
      },
      setPetActive: async (active) => {
        await act("POST", "/api/pet/active", { active }, "Mascote", () =>
          playSound(active ? "pet-along" : "pet-rest"),
        );
      },
      refresh: async () => {
        await request("POST", "/api/state");
      },
      tutorial,
      completeTutorial: async () => {
        const answer = await request("POST", "/api/tutorial");
        if (answer.ok) setTutorial(true);
        return answer.ok;
      },
      updateAvailable,
      updateVersion,
      applyUpdate,
    };
  }, [
    state,
    ready,
    authenticated,
    tutorial,
    notices,
    activity,
    moon,
    furyNow,
    updateAvailable,
    updateVersion,
    applyUpdate,
    dismissNotice,
    announce,
    act,
    beginRest,
    request,
    applyState,
    setActivity,
    syncProgress,
    persistActivity,
  ]);
  return (
    <GameContext.Provider value={value}>
      <ActivityEngine />
      {children}
    </GameContext.Provider>
  );
}
export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame precisa estar dentro de GameProvider.");
  return context;
}
