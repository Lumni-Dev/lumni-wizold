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
import { activityRepository } from "@/models/repositories/activity.repository";
import { moonRepository } from "@/models/repositories/moon.repository";
import type { MoonState } from "@/models/rules/moon";
import { AUTOMATION_TICK_MS, PET_EXERCISE_ID, REST_TICK_MS } from "@/shared/constants/game";
import { GAME_VERSION, VERSION_POLL_MS } from "@/shared/constants/version";
import { formatReais } from "@/shared/utils/format";
import { petLevelOf, petMaxEnergy } from "@/models/rules/pet";
import { deriveStats, type DerivedStats } from "@/models/rules/stats";
import type { BirthDate } from "@/shared/utils/birth";
import type { TavernIdentity } from "@/models/entities/tavern";
import type { HuntReport } from "./hunt.controller";
import type { ArenaResolution } from "./arena.controller";
import type { TrainingReport } from "./training.controller";
import * as automationController from "./automation.controller";
import { api, type ApiAnswer } from "./api.client";
import { playSound, preloadSounds, setVoiceProfile } from "./sound";
export interface Notice {
  id: number;
  text: string;
  ok: boolean;
  source: string;
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
  notify: (text: string, ok: boolean, source: string) => void;
  enter: (
    credential: string,
    birth: BirthDate,
  ) => Promise<{
    hasCharacter: boolean;
  } | null>;
  startRun: (name: string, gender: Gender) => Promise<boolean>;
  renameCharacter: (name: string) => Promise<boolean>;
  requestDeleteCode: () => Promise<boolean>;
  deleteRun: (code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  logoutEverywhere: () => Promise<void>;
  rest: () => Promise<void>;
  activity: Activity | null;
  setActivity: (activity: Activity | null) => void;
  train: (exerciseId: string) => Promise<{ message: string; raised: boolean } | null>;
  hunt: (territoryId: string, creatureId?: string) => Promise<HuntReport | null>;
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
  sellItem: (itemId: string, quantity?: number) => Promise<void>;
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
  mine: (oreId: string) => Promise<boolean>;
  enhance: (
    itemId: string,
    enhancement?: number,
  ) => Promise<{ message: string; raised: boolean } | null>;
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
  updateAvailable: boolean;
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
export function GameProvider({ children }: { children: ReactNode }) {
  const hydrated = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false,
  );
  const [state, setState] = useState<GameState>(initialState());
  const [booted, setBooted] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [activity, setActivityState] = useState<Activity | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const noticeCounter = useRef(0);
  const ready = hydrated && booted;
  const setActivity = useCallback((next: Activity | null) => {
    activityRepository.save(next);
    setActivityState(next);
  }, []);
  const moon = useSyncExternalStore(
    moonRepository.subscribe,
    moonRepository.snapshot,
    moonRepository.serverSnapshot,
  );
  const NOTICE_STACK = 4;
  const announce = useCallback((text: string, ok: boolean, source: string) => {
    noticeCounter.current += 1;
    const line = { id: noticeCounter.current, text, ok, source };
    setNotices((current) => [...current, line].slice(-NOTICE_STACK));
    if (!ok) playSound("denied");
  }, []);
  const dismissNotice = useCallback((id: number) => {
    setNotices((current) => current.filter((line) => line.id !== id));
  }, []);
  const applyUpdate = useCallback(() => {
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
  }, []);
  useEffect(() => {
    let alive = true;
    const check = async () => {
      const answer = await api("GET", "/api/version");
      if (alive && answer.version && answer.version !== GAME_VERSION) {
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
  const applyState = useCallback((next: GameState, seq: number) => {
    if (seq <= appliedRef.current) return;
    appliedRef.current = seq;
    setState(next);
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
        const answer = await api<T>(method, path, body);
        if (answer.status === 401) {
          setAuthenticated(false);
          return answer;
        }
        if (answer.state) {
          const seq = ++mintRef.current;
          if (defer === "hunt" && answer.ok) {
            heldHuntRef.current = {
              state: answer.state,
              seq,
              report: answer.data as HuntReport,
              at: Date.now(),
            };
          } else if (defer === "arena" && answer.ok) {
            heldArenaRef.current = { state: answer.state, seq, report: null, at: Date.now() };
          } else if (heldHuntRef.current) {
            heldHuntRef.current = { ...heldHuntRef.current, state: answer.state, seq };
          } else if (heldArenaRef.current) {
            heldArenaRef.current = { ...heldArenaRef.current, state: answer.state, seq };
          } else {
            applyState(answer.state, seq);
          }
        }
        return answer;
      } finally {
        if (defer) inFlightRef.current -= 1;
      }
    },
    [applyState],
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
  useEffect(() => {
    if (!hydrated) return;
    void (async () => {
      const answer = await request("POST", "/api/state");
      if (answer.status !== 401) setAuthenticated(true);
      setBooted(true);
    })();
  }, [hydrated, request]);
  useEffect(() => {
    if (!ready) return;
    const saved = activityRepository.load();
    if (saved && stateRef.current.character) setActivityState(saved);
  }, [ready]);
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
    const collect = async () => {
      const answer = await request<{
        done: boolean;
        ticks: number;
      }>("PATCH", "/api/character/rest");
      if (!answer.ok) {
        setActivity(null);
        return;
      }
      const ticks = answer.data?.ticks ?? 0;
      if (ticks > 0) playSound("rest");
      if (ticks > 0 && !answer.data?.done) {
        announce("O corpo se recompõe aos poucos.", true, "Recuperação");
      }
      if (answer.data?.done) {
        announce("Recuperação completa: vida e fúria inteiras.", true, "Recuperação");
        setActivity(automationController.resumeAfterRest(stateRef.current, activityRef.current));
      }
    };
    void collect();
    const timer = window.setInterval(() => void collect(), REST_TICK_MS);
    return () => window.clearInterval(timer);
  }, [ready, resting, request, setActivity, announce]);
  const automationBeatRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (!ready) return;
    let busy = false;
    const beat = async () => {
      if (busy) return;
      if (inFlightRef.current > 0 || heldHuntRef.current || heldArenaRef.current) return;
      if (!isVip(stateRef.current.character, Date.now())) return;
      busy = true;
      try {
        const step = automationController.nextAutomationStep(stateRef.current, activityRef.current);
        if (!step) return;
        switch (step.kind) {
          case "potion":
            await act("POST", "/api/inventory/consume", { itemId: step.itemId }, "Inventário", () =>
              playSound("potion"),
            );
            return;
          case "rest": {
            const answer = await act("POST", "/api/character/rest", undefined, "Recuperação", () =>
              playSound("rest"),
            );
            if (answer.ok) {
              const interrupted = activityRef.current;
              setActivity({
                kind: "rest",
                resume:
                  interrupted && interrupted.kind !== "rest"
                    ? { kind: interrupted.kind, id: interrupted.id }
                    : undefined,
              });
            }
            return;
          }
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
    const timer = window.setInterval(() => void beat(), AUTOMATION_TICK_MS);
    return () => {
      automationBeatRef.current = () => {};
      window.clearInterval(timer);
    };
  }, [ready, act, setActivity]);
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
      ? deriveStats(state.character, state.equipment, state.pet)
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
        }>("POST", "/api/auth/enter", {
          credential,
          birth,
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
      },
      logoutEverywhere: async () => {
        await api("POST", "/api/auth/logout-all");
        heldHuntRef.current = null;
        heldArenaRef.current = null;
        applyState(initialState(), ++mintRef.current);
        setActivity(null);
        setAuthenticated(false);
      },
      deleteRun: async (code) => {
        const answer = await api("DELETE", "/api/characters", { code });
        announce(answer.message, answer.ok, "Conta");
        if (answer.ok) {
          applyState(initialState(), ++mintRef.current);
          setActivity(null);
          setAuthenticated(false);
        }
        return answer.ok;
      },
      rest: async () => {
        const answer = await act("POST", "/api/character/rest", undefined, "Recuperação", () =>
          playSound("rest"),
        );
        if (answer.ok) setActivity({ kind: "rest" });
      },
      activity,
      setActivity,
      train: async (exerciseId) => {
        if (exerciseId === PET_EXERCISE_ID) {
          const answer = await request<{ leveled: boolean }>("POST", "/api/training/pet");
          if (!answer.ok) {
            if (answer.message) announce(answer.message, false, "Treino");
            return null;
          }
          return { message: answer.message, raised: answer.data?.leveled === true };
        }
        const answer = await request<TrainingReport>("POST", "/api/training/session", {
          exerciseId,
        });
        if (!answer.ok) {
          if (answer.message) announce(answer.message, false, "Treino");
          return null;
        }
        return { message: answer.message, raised: answer.data?.attributeRaised === true };
      },
      hunt: async (territoryId, creatureId) => {
        const answer = await request<HuntReport>(
          "POST",
          "/api/hunt",
          { territoryId, creatureId },
          "hunt",
        );
        if (!answer.ok) {
          if (answer.message) announce(answer.message, false, "Caça");
          return null;
        }
        return answer.data;
      },
      landHunt: () => {
        const held = heldHuntRef.current;
        heldHuntRef.current = null;
        if (!held) return;
        applyState(held.state, held.seq);
      },
      sufferBlow: (damage) => {
        setState((current) =>
          current.character
            ? {
                ...current,
                character: {
                  ...current.character,
                  health: Math.max(1, current.character.health - Math.max(0, Math.round(damage))),
                },
              }
            : current,
        );
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
      sellItem: async (itemId, quantity = 1) => {
        await act("POST", "/api/market/sell", { itemId, quantity }, "Mercado", () =>
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
        const answer = await act<{
          levelsGained: number;
        }>("POST", "/api/mine", { oreId }, "Mina", (data) => {
          if ((data?.levelsGained ?? 0) > 0) playSound("vein", 220);
        });
        return answer.ok;
      },
      enhance: async (itemId, enhancement = 0) => {
        const answer = await request<{ raised: boolean }>("POST", "/api/forge", {
          itemId,
          enhancement,
        });
        if (!answer.ok) {
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
      updateAvailable,
      applyUpdate,
    };
  }, [
    state,
    ready,
    authenticated,
    notices,
    activity,
    moon,
    updateAvailable,
    applyUpdate,
    dismissNotice,
    announce,
    act,
    request,
    applyState,
    setActivity,
  ]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame precisa estar dentro de GameProvider.");
  return context;
}
