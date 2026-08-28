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
import type { Result } from "@/models/entities/result";
import { activityRepository } from "@/models/repositories/activity.repository";
import { gameRepository } from "@/models/repositories/game.repository";
import { moonRepository } from "@/models/repositories/moon.repository";
import { tavernRepository } from "@/models/repositories/tavern.repository";
import type { MoonState } from "@/models/rules/moon";
import { AUTOMATION_TICK_MS, PET_EXERCISE_ID, REST_TICK_MS } from "@/shared/constants/game";
import { deriveStats, type DerivedStats } from "@/models/rules/stats";
import type { Hunter } from "@/models/entities/ranking";
import type { TavernIdentity } from "@/models/entities/tavern";
import * as characterController from "./character.controller";
import * as packController from "./pack.controller";
import { playSound, preloadSounds, setVoiceProfile } from "./sound";
import * as arenaController from "./arena.controller";
import * as huntController from "./hunt.controller";
import * as automationController from "./automation.controller";
import * as bazaarController from "./bazaar.controller";
import * as forgeController from "./forge.controller";
import * as inventoryController from "./inventory.controller";
import * as marketController from "./market.controller";
import * as petController from "./pet.controller";
import * as storeController from "./store.controller";
import * as trainingController from "./training.controller";

export interface Notice {
  id: number;
  text: string;
  ok: boolean;
  source: string;
}

export type { Activity };

interface GameContextValue {
  ready: boolean;
  state: GameState;
  character: Character | null;
  pet: Pet | null;
  stats: DerivedStats | null;
  moon: MoonState;
  notices: Notice[];
  dismissNotice: (id: number) => void;
  notify: (text: string, ok: boolean, source: string) => void;
  startRun: (name: string, gender: Gender) => boolean;
  renameCharacter: (name: string) => boolean;
  deleteRun: () => void;
  toggleForm: () => void;
  rest: () => void;
  activity: Activity | null;
  setActivity: (activity: Activity | null) => void;
  train: (exerciseId: string) => boolean;
  resolveHunt: (territoryId: string) => huntController.HuntResolution | null;
  sufferBlow: (damage: number) => void;
  commitHunt: (
    resolution: huntController.HuntResolution,
    alreadyBled: number,
  ) => huntController.HuntReport | null;
  drawOpponent: () => Hunter | null;
  resolveArena: (hunterId: string) => arenaController.ArenaResolution | null;
  commitArena: (
    resolution: arenaController.ArenaResolution,
    alreadyBled: number,
  ) => arenaController.ArenaResolution | null;
  equipItem: (itemId: string) => void;
  unequipItem: (slot: EquipmentSlot) => void;
  consumeItem: (itemId: string) => void;
  discardItem: (itemId: string, quantity?: number) => void;
  buyItem: (itemId: string, quantity?: number) => void;
  sellItem: (itemId: string, quantity?: number) => void;
  announceListing: (itemId: string, quantity: number, priceCents: number) => boolean;
  cancelListing: (listingId: string) => void;
  purchaseListing: (listingId: string, quantity: number) => boolean;
  requestWithdraw: (pixKey: string) => boolean;
  buyPack: (packId: string) => boolean;
  mine: (oreId: string) => boolean;
  enhance: (slot: EquipmentSlot) => void;
  adoptPet: (gender: PetGender, name: string) => void;
  releasePet: () => void;
  setAutomation: (key: AutomationKey, on: boolean) => void;
  addToPack: (person: TavernIdentity) => boolean;
  addToPackByNick: (nick: string, atTables: readonly TavernIdentity[]) => boolean;
  removeFromPack: (id: string) => void;
  renamePet: (name: string) => boolean;
  feedPet: (itemId: string) => void;
  setPetActive: (active: boolean) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

function subscribeToClient() {
  return () => undefined;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const ready = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false,
  );

  const [stateInMemory, setState] = useState<GameState | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [activity, setActivityState] = useState<Activity | null>(null);
  const noticeCounter = useRef(0);

  const setActivity = useCallback((next: Activity | null) => {
    activityRepository.save(next);
    setActivityState(next);
  }, []);

  const savedState = useMemo(() => (ready ? gameRepository.load() : initialState()), [ready]);
  const state = stateInMemory ?? savedState;

  useEffect(() => {
    if (!ready || !stateInMemory) return;
    if (!stateInMemory.character) {
      gameRepository.clear();
      return;
    }
    gameRepository.save(stateInMemory);
  }, [stateInMemory, ready]);

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

  useEffect(() => {
    if (!ready) return;
    const saved = activityRepository.load();
    if (saved && stateRef.current.character) setActivityState(saved);
  }, [ready]);

  const petResting = state.pet !== null && state.pet.active === false;
  useEffect(() => {
    if (!petResting) return;

    const timer = window.setInterval(() => {
      const result = petController.restPetTick(stateRef.current);
      if (!result.ok) return;
      setState(result.state);
      if (result.message) announce(result.message, true, "Mascote");
    }, REST_TICK_MS);

    return () => window.clearInterval(timer);
  }, [petResting, announce]);

  useEffect(() => {
    if (activity?.kind !== "rest") return;

    const timer = window.setInterval(() => {
      const result = characterController.restTick(stateRef.current);
      setState(result.state);

      if (result.ok && result.message) announce(result.message, true, "Recuperação");
      if (!result.ok || result.data?.done) {
        const back = result.data?.done
          ? automationController.resumeAfterRest(result.state, activityRef.current)
          : null;
        setActivity(back);
      }
    }, REST_TICK_MS);

    return () => window.clearInterval(timer);
  }, [activity?.kind, announce, setActivity]);

  useEffect(() => {
    if (!ready) return;

    const beat = () => {
      const step = automationController.nextAutomationStep(stateRef.current, activityRef.current);
      if (!step) return;

      switch (step.kind) {
        case "potion": {
          const result = inventoryController.consumeItem(stateRef.current, step.itemId);
          setState(result.state);
          if (result.ok) {
            announce(result.message, true, "Inventário");
            playSound("potion");
          }
          return;
        }
        case "transform": {
          const result = characterController.toggleForm(stateRef.current);
          setState(result.state);
          if (result.ok) {
            announce(result.message, true, "Personagem");
            playSound("transform");
          }
          return;
        }
        case "rest": {
          const result = characterController.startRest(stateRef.current);
          setState(result.state);
          if (result.ok) {
            announce(result.message, true, "Recuperação");
            playSound("rest");
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
        case "feed": {
          const result = petController.feedPet(stateRef.current, step.itemId);
          setState(result.state);
          if (result.ok) {
            announce(result.message, true, "Mascote");
            playSound("pet-along");
          }
          return;
        }
        case "kennel": {
          const result = petController.setPetActive(stateRef.current, step.active);
          setState(result.state);
          if (result.ok) {
            announce(result.message, true, "Mascote");
            playSound(step.active ? "pet-along" : "pet-rest");
          }
          return;
        }
        case "work":
          setActivity(step.activity);
          return;
      }
    };

    const timer = window.setInterval(beat, AUTOMATION_TICK_MS);
    return () => window.clearInterval(timer);
  }, [ready, announce, setActivity]);

  const character = state.character;
  useEffect(() => {
    if (!character || character.form !== "werewolf") return;

    const timer = window.setTimeout(() => {
      const result = characterController.expireTransformation(stateRef.current);
      setState(result.state);
      if (result.message) announce(result.message, true, "Personagem");
    }, characterController.transformationRemainingMs(character));

    return () => window.clearTimeout(timer);
  }, [character, announce]);

  useEffect(() => {
    if (!ready) return;

    const settle = () => {
      const result = bazaarController.settleListings(stateRef.current);
      if (result.state === stateRef.current) return;
      setState(result.state);
      if (result.message) announce(result.message, true, "Bazar");
    };

    settle();
    const timer = window.setInterval(settle, 60_000);
    return () => window.clearInterval(timer);
  }, [ready, announce]);

  const apply = useCallback(
    <T,>(result: Result<T>, source: string): T | null => {
      setState(result.state);
      announce(result.message, result.ok, source);
      return result.ok ? (result.data ?? null) : null;
    },
    [announce],
  );

  const value = useMemo<GameContextValue>(() => {
    const stats = state.character
      ? deriveStats(state.character, state.equipment, state.pet, state.enhancements)
      : null;

    return {
      ready,
      state,
      character: state.character,
      pet: state.pet,
      stats,
      moon,
      notices,
      dismissNotice,
      notify: announce,

      startRun: (name, gender) => {
        const result = characterController.startRun(name, gender);
        if (!result.ok) {
          announce(result.message, false, "Personagem");
          return false;
        }
        setState(result.state);
        announce(result.message, true, "Personagem");
        playSound("transform");
        return true;
      },

      renameCharacter: (name) => {
        const result = characterController.renameCharacter(state, name);
        apply(result, "Personagem");
        return result.ok;
      },
      deleteRun: () => {
        gameRepository.clear();
        tavernRepository.clear();
        setState(initialState());
        setActivity(null);
      },
      toggleForm: () => {
        const wasHuman = state.character?.form === "human";
        const result = characterController.toggleForm(state);
        apply(result, "Personagem");
        if (result.ok) playSound(wasHuman ? "transform" : "revert");
      },
      rest: () => {
        const result = characterController.startRest(state);
        apply(result, "Recuperação");
        if (result.ok) {
          playSound("rest");
          setActivity({ kind: "rest" });
        }
      },
      activity,
      setActivity,
      train: (exerciseId) => {
        if (exerciseId === PET_EXERCISE_ID) {
          const report = apply(petController.trainPet(state), "Treino");
          if (!report) return false;
          if (report.leveled) playSound("pet-up", 320);
          return true;
        }

        const report = apply(trainingController.train(state, exerciseId), "Treino");
        if (!report) return false;
        if (report.attributeRaised) playSound("point", 320);
        return true;
      },
      resolveHunt: (territoryId) => {
        const result = huntController.resolveHunt(state, territoryId);
        if (!result.ok || !result.data) {
          announce(result.message, false, "Caça");
          return null;
        }
        return result.data;
      },
      sufferBlow: (damage) => {
        const result = characterController.sufferBlow(state, damage);
        if (result.ok) setState(result.state);
      },
      commitHunt: (resolution, alreadyBled) => {
        const report = apply(huntController.landHunt(state, resolution, alreadyBled), "Caça");
        if (report?.combat.victory) playSound("spoils");
        if (report && report.levelsGained > 0) playSound("levelup", 700);
        if (report?.petLeveled) playSound("pet-up", 1100);
        return report;
      },
      drawOpponent: () => arenaController.drawOpponent(state),
      resolveArena: (hunterId) => {
        const result = arenaController.resolveArena(state, hunterId);
        if (!result.ok || !result.data) {
          announce(result.message, false, "Arena");
          return null;
        }
        return result.data;
      },
      commitArena: (resolution, alreadyBled) =>
        apply(arenaController.landArena(state, resolution, alreadyBled), "Arena"),
      equipItem: (itemId) => {
        const result = inventoryController.equipItem(state, itemId);
        apply(result, "Inventário");
        if (result.ok) playSound("equip");
      },
      unequipItem: (slot) => {
        const result = inventoryController.unequipItem(state, slot);
        apply(result, "Inventário");
        if (result.ok) playSound("equip");
      },
      consumeItem: (itemId) => {
        const result = inventoryController.consumeItem(state, itemId);
        apply(result, "Inventário");
        if (result.ok) playSound("potion");
      },
      discardItem: (itemId, quantity = 1) => {
        const result = inventoryController.discardItem(state, itemId, quantity);
        apply(result, "Inventário");
        if (result.ok) playSound("discard");
      },
      buyItem: (itemId, quantity = 1) => {
        const result = marketController.buyItem(state, itemId, quantity);
        apply(result, "Mercado");
        if (result.ok) playSound("buy");
      },
      sellItem: (itemId, quantity = 1) => {
        const result = marketController.sellItem(state, itemId, quantity);
        apply(result, "Mercado");
        if (result.ok) playSound("sell");
      },
      announceListing: (itemId, quantity, priceCents) => {
        const result = bazaarController.announceListing(state, itemId, quantity, priceCents);
        apply(result, "Bazar");
        if (result.ok) playSound("ui");
        return result.ok;
      },
      cancelListing: (listingId) => {
        const result = bazaarController.cancelListing(state, listingId);
        apply(result, "Bazar");
        if (result.ok) playSound("ui");
      },
      purchaseListing: (listingId, quantity) => {
        const result = bazaarController.purchaseListing(state, listingId, quantity);
        apply(result, "Bazar");
        if (result.ok) playSound("buy");
        return result.ok;
      },
      requestWithdraw: (pixKey) => {
        const result = bazaarController.requestWithdraw(state, pixKey);
        apply(result, "Bazar");
        if (result.ok) playSound("sell");
        return result.ok;
      },
      buyPack: (packId) => {
        const result = storeController.purchasePack(state, packId);
        apply(result, "Loja");
        if (result.ok) playSound("buy");
        return result.ok;
      },
      mine: (oreId) => {
        const result = forgeController.mine(state, oreId);
        apply(result, "Mina");
        if (result.ok && (result.data?.levelsGained ?? 0) > 0) playSound("vein", 220);
        return result.ok;
      },
      enhance: (slot) => apply(forgeController.enhance(state, slot), "Bigorna"),
      adoptPet: (gender, name) => {
        const result = petController.adoptPet(state, gender, name);
        apply(result, "Mascote");
        if (result.ok) {
          playSound("buy");
          playSound("howl", 240);
        }
      },
      releasePet: () => {
        const result = petController.releasePet(state);
        apply(result, "Mascote");
        if (result.ok) playSound("beast");
      },
      setAutomation: (key, on) => {
        setState({ ...state, automation: { ...state.automation, [key]: on } });
        playSound("ui");
      },
      addToPack: (person) => {
        const result = packController.addMate(state, person);
        apply(result, "Matilha");
        if (result.ok) playSound("chat");
        return result.ok;
      },
      addToPackByNick: (nick, atTables) => {
        const result = packController.addByNick(state, nick, atTables);
        apply(result, "Matilha");
        if (result.ok) playSound("chat");
        return result.ok;
      },
      removeFromPack: (id) => {
        const result = packController.removeMate(state, id);
        apply(result, "Matilha");
        if (result.ok) playSound("discard");
      },
      renamePet: (name) => {
        const result = petController.renamePet(state, name);
        apply(result, "Mascote");
        if (result.ok) playSound("buy");
        return result.ok;
      },
      feedPet: (itemId) => {
        const result = petController.feedPet(state, itemId);
        apply(result, "Mascote");
        if (result.ok) playSound("beast");
      },
      setPetActive: (active) => {
        const result = petController.setPetActive(state, active);
        apply(result, "Mascote");
        if (result.ok) playSound(active ? "pet-along" : "pet-rest");
      },
    };
  }, [state, ready, notices, activity, moon, dismissNotice, apply, announce, setActivity]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame precisa estar dentro de GameProvider.");
  return context;
}
