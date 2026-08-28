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
import type { Activity } from "@/models/entities/activity";
import type { AutomationKey } from "@/models/entities/automation";
import type { EquipmentSlot } from "@/models/entities/item";
import { initialState, type GameState } from "@/models/entities/game-state";
import type { Character, Gender } from "@/models/entities/character";
import type { Pet, PetGender } from "@/models/entities/pet";
import { activityRepository } from "@/models/repositories/activity.repository";
import { moonRepository } from "@/models/repositories/moon.repository";
import type { MoonState } from "@/models/rules/moon";
import { AUTOMATION_TICK_MS, PET_EXERCISE_ID, REST_TICK_MS } from "@/shared/constants/game";
import { formatReais } from "@/shared/utils/format";
import { deriveStats, type DerivedStats } from "@/models/rules/stats";
import type { BirthDate } from "@/shared/utils/birth";
import type { TavernIdentity } from "@/models/entities/tavern";
import type { HuntReport } from "./hunt.controller";
import type { ArenaResolution } from "./arena.controller";
import type { TrainingReport } from "./training.controller";
import * as automationController from "./automation.controller";
import * as characterController from "./character.controller";
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
  deleteRun: () => Promise<void>;
  toggleForm: () => Promise<void>;
  rest: () => Promise<void>;
  activity: Activity | null;
  setActivity: (activity: Activity | null) => void;
  train: (exerciseId: string) => Promise<boolean>;
  hunt: (territoryId: string) => Promise<HuntReport | null>;
  landHunt: () => void;
  sufferBlow: (damage: number) => void;
  drawOpponent: () => Promise<{
    hunterId: string;
    name: string;
  } | null>;
  challengeArena: (hunterId: string) => Promise<ArenaResolution | null>;
  landArena: () => void;
  equipItem: (itemId: string) => Promise<void>;
  unequipItem: (slot: EquipmentSlot) => Promise<void>;
  consumeItem: (itemId: string) => Promise<void>;
  discardItem: (itemId: string, quantity?: number) => Promise<void>;
  buyItem: (itemId: string, quantity?: number) => Promise<void>;
  sellItem: (itemId: string, quantity?: number) => Promise<void>;
  announceListing: (itemId: string, quantity: number, priceCents: number) => Promise<boolean>;
  cancelListing: (listingId: string) => Promise<void>;
  purchaseListing: (listingId: string, quantity: number) => Promise<boolean>;
  requestWithdraw: (pixKey: string, fullName: string, cpf: string) => Promise<boolean>;
  buyPack: (packId: string) => Promise<boolean>;
  mine: (oreId: string) => Promise<boolean>;
  enhance: (slot: EquipmentSlot) => Promise<boolean>;
  adoptPet: (gender: PetGender, name: string) => Promise<void>;
  releasePet: () => Promise<void>;
  setAutomation: (key: AutomationKey, on: boolean) => void;
  addToPack: (person: TavernIdentity) => Promise<boolean>;
  addToPackByNick: (nick: string) => Promise<boolean>;
  removeFromPack: (id: string) => Promise<void>;
  renamePet: (name: string) => Promise<boolean>;
  feedPet: (itemId: string) => Promise<void>;
  setPetActive: (active: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}
const GameContext = createContext<GameContextValue | null>(null);
function subscribeToClient() {
  return () => undefined;
}
interface HeldLanding {
  state: GameState;
  seq: number;
  report: HuntReport | null;
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
  const [notices, setNotices] = useState<Notice[]>([]);
  const [activity, setActivityState] = useState<Activity | null>(null);
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
  useEffect(() => {
    preloadSounds();
  }, []);
  const lineage = state.character?.gender ?? "male";
  const shape = state.character?.form ?? "human";
  useEffect(() => {
    setVoiceProfile(lineage, shape);
  }, [lineage, shape]);
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
      const answer = await api<T>(method, path, body);
      if (answer.status === 401) {
        setAuthenticated(false);
        return answer;
      }
      if (answer.state) {
        const seq = ++mintRef.current;
        if (defer === "hunt" && answer.ok) {
          heldHuntRef.current = { state: answer.state, seq, report: answer.data as HuntReport };
        } else if (defer === "arena" && answer.ok) {
          heldArenaRef.current = { state: answer.state, seq, report: null };
        } else {
          applyState(answer.state, seq);
        }
      }
      return answer;
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
  const petResting = state.pet !== null && state.pet.active === false;
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
      if ((answer.data?.ticks ?? 0) > 0 && !answer.data?.done) {
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
  useEffect(() => {
    if (!ready) return;
    let busy = false;
    const beat = async () => {
      if (busy) return;
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
          case "transform":
            await act("POST", "/api/character/transform", undefined, "Personagem", () =>
              playSound("transform"),
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
              playSound("pet-along"),
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
    const timer = window.setInterval(() => void beat(), AUTOMATION_TICK_MS);
    return () => window.clearInterval(timer);
  }, [ready, act, setActivity]);
  const character = state.character;
  useEffect(() => {
    if (!ready || !character || character.form !== "werewolf") return;
    const timer = window.setTimeout(() => {
      announce(
        "A fúria se esgota. " + character.name + " volta à forma humana.",
        true,
        "Personagem",
      );
      void request("POST", "/api/state");
    }, characterController.transformationRemainingMs(character));
    return () => window.clearTimeout(timer);
  }, [ready, character, request, announce]);
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
      ? deriveStats(state.character, state.equipment, state.pet, state.enhancements)
      : null;
    return {
      ready,
      authenticated,
      state,
      character: state.character,
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
      deleteRun: async () => {
        const answer = await api("DELETE", "/api/characters");
        announce(answer.message, answer.ok, "Personagem");
        applyState(initialState(), ++mintRef.current);
        setActivity(null);
      },
      toggleForm: async () => {
        const wasHuman = state.character?.form === "human";
        await act("POST", "/api/character/transform", undefined, "Personagem", () =>
          playSound(wasHuman ? "transform" : "revert"),
        );
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
          const answer = await act<{
            leveled: boolean;
          }>("POST", "/api/training/pet", undefined, "Treino", (data) => {
            if (data?.leveled) playSound("pet-up", 320);
          });
          return answer.ok;
        }
        const answer = await act<TrainingReport>(
          "POST",
          "/api/training/session",
          { exerciseId },
          "Treino",
          (data) => {
            if (data?.attributeRaised) playSound("point", 320);
          },
        );
        return answer.ok;
      },
      hunt: async (territoryId) => {
        const answer = await request<HuntReport>("POST", "/api/hunt", { territoryId }, "hunt");
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
        const report = held.report;
        if (!report) return;
        if (report.combat.victory) playSound("spoils");
        if (report.levelsGained > 0) playSound("levelup", 700);
        if (report.petLeveled) playSound("pet-up", 1100);
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
      equipItem: async (itemId) => {
        await act("POST", "/api/inventory/equip", { itemId }, "Inventário", () =>
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
          playSound("potion"),
        );
      },
      discardItem: async (itemId, quantity = 1) => {
        await act("POST", "/api/inventory/discard", { itemId, quantity }, "Inventário", () =>
          playSound("discard"),
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
      announceListing: async (itemId, quantity, priceCents) => {
        const answer = await act(
          "POST",
          "/api/bazaar/announce",
          { itemId, quantity, priceCents },
          "Bazar",
          () => playSound("ui"),
        );
        return answer.ok;
      },
      cancelListing: async (listingId) => {
        await act("POST", "/api/bazaar/cancel", { listingId }, "Bazar", () => playSound("ui"));
      },
      purchaseListing: async (listingId, quantity) => {
        const answer = await act(
          "POST",
          "/api/bazaar/purchase",
          { listingId, quantity },
          "Bazar",
          () => playSound("buy"),
        );
        return answer.ok;
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
        const answer = await act("POST", "/api/store/purchase", { packId }, "Loja", () =>
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
      enhance: async (slot) => {
        const answer = await act("POST", "/api/forge", { slot }, "Bigorna");
        return answer.ok;
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
        setState((current) => ({
          ...current,
          automation: { ...current.automation, [key]: on },
        }));
        playSound("ui");
        void request("PUT", "/api/automation", { key, on });
      },
      addToPack: async (person) => {
        const answer = await act(
          "POST",
          "/api/pack",
          { id: person.id, name: person.name },
          "Matilha",
          () => playSound("chat"),
        );
        return answer.ok;
      },
      addToPackByNick: async (nick) => {
        const answer = await act("POST", "/api/pack", { nick }, "Matilha", () => playSound("chat"));
        return answer.ok;
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
        await act("POST", "/api/pet/feed", { itemId }, "Mascote", () => playSound("beast"));
      },
      setPetActive: async (active) => {
        await act("POST", "/api/pet/active", { active }, "Mascote", () =>
          playSound(active ? "pet-along" : "pet-rest"),
        );
      },
      refresh: async () => {
        await request("POST", "/api/state");
      },
    };
  }, [
    state,
    ready,
    authenticated,
    notices,
    activity,
    moon,
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
