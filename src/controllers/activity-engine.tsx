"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { findForgePiece } from "@/controllers/forge.controller";
import {
  listTerritories,
  resolveHuntCreatureId,
  type HuntReport,
} from "@/controllers/hunt.controller";
import { listExercises } from "@/controllers/training.controller";
import { loadBrewPicks } from "@/models/repositories/alchemy-selection.repository";
import { loadHuntSelection } from "@/models/repositories/hunt-selection.repository";
import type { Activity } from "@/models/entities/activity";
import type { GameState } from "@/models/entities/game-state";
import { findItem } from "@/models/data/items";
import { TERRITORIES } from "@/models/data/territories";
import { forgeDurationMs } from "@/models/rules/forge";
import { miningSwingTicks } from "@/models/rules/mining";
import { isVip } from "@/models/rules/vip";
import { trainingSessionTicks } from "@/models/rules/training";
import {
  ALCHEMY_TICKS,
  ALCHEMY_TICK_MS,
  CYCLE_OPTOUT_SECS,
  FORGE_TICKS,
  HUNT_APPROACH_TICKS,
  HUNT_TICK_MS,
  MAX_ENHANCEMENT,
  MINING_TICK_MS,
  MINING_TICKS_MIN,
  PET_EXERCISE_ID,
  TRAINING_TICKS_MIN,
  TRAINING_TICK_MS,
} from "@/shared/constants/game";
import { formatNumber } from "@/shared/utils/format";
import { hunterRetreated, hunterWon } from "@/models/rules/combat";
import { narrationOf } from "@/views/presenters/hunt.presenter";
import { rageFlaskToDrink } from "./automation.controller";
import { requestAutomationPulse } from "./automation-pulse";
import { isGameSound, playSound } from "./sound";
import { useGame } from "./game.context";
import { activitySync } from "./activity-sync";
import { createDriftLoop } from "./activity-loop";
import {
  activityHref,
  activityRuntimeStore,
  activityTone,
  clearActivityRuntime,
  patchActivityRuntime,
  type ActivityDockView,
} from "./activity-runtime";

function resolveTrainingSessionTicks(exerciseId: string, carry: number, activity: Activity | null): number {
  const prior = activityRuntimeStore.snapshot().train;
  if (
    prior?.id === exerciseId &&
    prior.max >= TRAINING_TICKS_MIN &&
    (carry > 0 || (prior.beat > 0 && prior.beat < prior.max))
  ) {
    return prior.max;
  }
  if (
    activity?.kind === "train" &&
    activity.id === exerciseId &&
    (activity.laps ?? 0) >= TRAINING_TICKS_MIN &&
    carry > 0
  ) {
    return activity.laps as number;
  }
  return trainingSessionTicks();
}

function resolveMiningSwingTicks(oreId: string, carry: number, activity: Activity | null): number {
  const prior = activityRuntimeStore.snapshot().mine;
  if (
    prior?.id === oreId &&
    prior.max >= MINING_TICKS_MIN &&
    (carry > 0 || (prior.beat > 0 && prior.beat < prior.max))
  ) {
    return prior.max;
  }
  if (
    activity?.kind === "mine" &&
    activity.id === oreId &&
    (activity.laps ?? 0) >= MINING_TICKS_MIN &&
    carry > 0
  ) {
    return activity.laps as number;
  }
  return miningSwingTicks();
}

function patchRuntime(patch: Parameters<typeof patchActivityRuntime>[0]): void {
  patchActivityRuntime(patch);
}

function cooldownLeft(activity: Activity | null): number {
  if (!activity?.cooldownUntil) return 0;
  return Math.max(0, Math.ceil((Date.parse(activity.cooldownUntil) - Date.now()) / 1000));
}

const HUNT_READY_KEY = "lumni-wizold:hunt-ready";

function huntReadyInMs(): number {
  if (typeof window === "undefined") return 0;
  const at = Number(window.localStorage.getItem(HUNT_READY_KEY));
  if (!Number.isFinite(at)) return 0;
  return Math.max(0, Math.ceil(at - Date.now()));
}

function markHuntReadyIn(ms: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HUNT_READY_KEY, String(Date.now() + Math.max(0, ms)));
}

function territoryName(id: string): string {
  return TERRITORIES.find((entry) => entry.id === id)?.name ?? "Hunt";
}

function dockOf(
  kind: ActivityDockView["kind"],
  title: string,
  detail: string,
  beat: number,
  max: number,
  cooldown: number | null,
  canStop = cooldown !== null,
): ActivityDockView {
  return {
    kind,
    title,
    detail,
    beat,
    max: Math.max(1, max),
    cooldown,
    tone: activityTone(kind),
    href: activityHref(kind),
    canStop,
  };
}

function restDock(activity: Activity): ActivityDockView {
  const resume = activity.resume?.kind;
  const back =
    resume === "hunt"
      ? "back to the hunt"
      : resume === "train"
        ? "back to the training"
        : resume === "mine"
          ? "back to the mine"
          : resume === "forge"
            ? "back to the forge"
            : resume === "alchemy"
              ? "back to the cauldron"
              : null;
  const after =
    resume === "hunt"
      ? "The hunt continues after."
      : resume === "train"
        ? "The training continues after."
        : resume === "mine"
          ? "The mine continues after."
          : resume === "forge"
            ? "The forge continues after."
            : resume === "alchemy"
              ? "The cauldron continues after."
              : "The body rests.";
  return dockOf(
    "rest",
    back ? "Recovering · " + back : "Recovering",
    after,
    0,
    1,
    null,
    true,
  );
}

function placeholderDock(state: GameState, activity: Activity): ActivityDockView {
  if (activity.kind === "hunt") {
    const name = activity.id ? territoryName(activity.id) : "Hunt";
    return dockOf("hunt", "Hunting · " + name, "Tracking the prey", 0, 1, null, false);
  }
  if (activity.kind === "train") {
    const label =
      activity.id === PET_EXERCISE_ID
        ? "Wolf training"
        : (listExercises(state).find((row) => row.exercise.id === activity.id)?.exercise.name ??
          "Training");
    return dockOf("train", label, "Session under way", 0, 1, null, false);
  }
  if (activity.kind === "mine") {
    const name = activity.id ? (findItem(activity.id)?.name ?? "Mine") : "Mine";
    return dockOf("mine", "Mining · " + name, "Pick strike", 0, 1, null, false);
  }
  if (activity.kind === "forge") {
    const name = activity.id
      ? (findForgePiece(state, activity.id, activity.enhancement ?? 0)?.item.name ?? "Piece")
      : "Piece";
    return dockOf("forge", "Forging · " + name, "Hammering under way", 0, 1, null, false);
  }
  if (activity.kind === "alchemy") {
    const name = activity.id ? (findItem(activity.id)?.name ?? "Potion") : "Potion";
    return dockOf("alchemy", "Brewing · " + name, "The cauldron works", 0, 1, null, false);
  }
  return restDock(activity);
}

function pausedDock(state: GameState, activity: Activity): ActivityDockView {
  const name =
    activity.kind === "hunt" && activity.id
      ? territoryName(activity.id)
      : activity.kind === "mine" && activity.id
        ? (findItem(activity.id)?.name ?? "Mine")
        : activity.kind === "forge" && activity.id
          ? (findForgePiece(state, activity.id, activity.enhancement ?? 0)?.item.name ?? "Piece")
          : activity.kind === "alchemy" && activity.id
            ? (findItem(activity.id)?.name ?? "Potion")
            : null;
  const titles: Record<ActivityDockView["kind"], string> = {
    hunt: "Hunt paused",
    train: "Training paused",
    mine: "Mine paused",
    forge: "Forge paused",
    alchemy: "Cauldron paused",
    rest: "Recovering",
  };
  const details: Record<ActivityDockView["kind"], string> = {
    hunt: "Waiting for health or a potion to continue",
    train: "Waiting for WCoins to continue",
    mine: "Waiting for resources to mine again",
    forge: "Waiting for fragments and WCoins for the next strike",
    alchemy: "Waiting for a flask and the ingredients",
    rest: "The body rests.",
  };
  const prefix = name ? name + " · " : "";
  const trainDetail =
    activity.kind === "train" && activity.id === PET_EXERCISE_ID
      ? "Waiting for WCoins to continue"
      : activity.kind === "train"
        ? "Waiting to continue"
        : details[activity.kind];
  return dockOf(activity.kind, prefix + titles[activity.kind], trainDetail, 0, 1, null, true);
}

export function ActivityEngine() {
  const pathname = usePathname();
  const syncRole = useSyncExternalStore(activitySync.subscribe, activitySync.role, () => "idle" as const);
  const runsEngine = syncRole === "owner" && pathname !== "/";
  const {
    ready,
    activity,
    setActivity,
    syncProgress,
    persistActivity,
    state,
    hunt,
    landHunt,
    sufferBlow,
    train,
    mine,
    enhance,
    brewPotion,
    notify,
  } = useGame();

  const activityRef = useRef(activity);
  const stateRef = useRef(state);
  const autoRef = useRef(state.automation);
  const huntRef = useRef(hunt);
  const landHuntRef = useRef(landHunt);
  const sufferRef = useRef(sufferBlow);
  const trainRef = useRef(train);
  const mineRef = useRef(mine);
  const enhanceRef = useRef(enhance);
  const brewRef = useRef(brewPotion);
  const notifyRef = useRef(notify);
  const setActivityRef = useRef(setActivity);
  const syncProgressRef = useRef(syncProgress);
  const persistActivityRef = useRef(persistActivity);
  const forgeLevelRef = useRef(0);
  const forgeItemRef = useRef<string | null>(null);

  useEffect(() => {
    activityRef.current = activity;
    stateRef.current = state;
    autoRef.current = state.automation;
    huntRef.current = hunt;
    landHuntRef.current = landHunt;
    sufferRef.current = sufferBlow;
    trainRef.current = train;
    mineRef.current = mine;
    enhanceRef.current = enhance;
    brewRef.current = brewPotion;
    notifyRef.current = notify;
    setActivityRef.current = setActivity;
    syncProgressRef.current = syncProgress;
    persistActivityRef.current = persistActivity;
  });

  useEffect(() => {
    if (!ready || !runsEngine) return;
    const paused = activity?.paused === true;
    const activeHunt =
      activity?.kind === "hunt" && !paused && activity.id ? activity.id : null;

    if (!activeHunt) {
      patchRuntime({ hunt: null });
      return;
    }

    let alive = true;
    let coolTimer = 0;
    let fillTimer = 0;
    let beat = 0;
    let approachBeat = 0;
    let approaching = false;
    let script: ReturnType<typeof narrationOf> = [];
    let pending: HuntReport | null = null;
    const priorHunt = activityRuntimeStore.snapshot().hunt;
    let lastFoe = priorHunt?.territoryId === activeHunt ? priorHunt.lastFoe : null;
    let requesting = false;
    let furyWaitStarted = 0;
    const bled = { last: stateRef.current.character?.health ?? 0 };

    const push = (cooldown: number | null) => {
      const max = Math.max(1, script.length);
      const line = script[Math.min(beat, script.length) - 1];
      const detail = approaching
        ? "Tracking the prey"
        : pending && beat > 0 && line
          ? line.text.slice(0, 72) + (line.text.length > 72 ? "…" : "")
          : pending
            ? "Preparing the ambush"
            : "Tracking the prey";
      patchActivityRuntime({
        hunt: {
          territoryId: activeHunt,
          beat,
          script,
          pending,
          cooldown,
          lastFoe,
          approach: approaching ? { beat: approachBeat, max: HUNT_APPROACH_TICKS } : null,
        },
        dock: dockOf(
          "hunt",
          "Hunting · " + territoryName(activeHunt),
          detail,
          approaching ? approachBeat : beat,
          approaching ? HUNT_APPROACH_TICKS : max,
          cooldown,
        ),
      });
    };

    const startLap = () => {
      beat = 0;
      approachBeat = 0;
      approaching = false;
      script = [];
      pending = null;
      requesting = true;
      push(null);
      const wait = huntReadyInMs();
      if (wait > 0) {
        fillTimer = window.setTimeout(startLap, wait);
        return;
      }
      if (
        rageFlaskToDrink(stateRef.current) &&
        isVip(stateRef.current.character, Date.now())
      ) {
        if (!furyWaitStarted) furyWaitStarted = Date.now();
        if (Date.now() - furyWaitStarted < 8000) {
          requestAutomationPulse();
          fillTimer = window.setTimeout(startLap, 250);
          return;
        }
      }
      furyWaitStarted = 0;
      approaching = true;
      requesting = false;
      push(null);
    };

    const fireHunt = () => {
      requesting = true;
      const selection = loadHuntSelection();
      const row = listTerritories(stateRef.current).find(
        (entry) => entry.territory.id === activeHunt,
      );
      const creatureId = row
        ? resolveHuntCreatureId(row.creatures, selection[activeHunt])
        : selection[activeHunt];
      void huntRef.current(activeHunt, creatureId || undefined).then((result) => {
        if (!alive) return;
        requesting = false;
        if (result.kind === "retry") {
          markHuntReadyIn(result.retryAfterMs);
          fillTimer = window.setTimeout(startLap, Math.max(HUNT_TICK_MS, result.retryAfterMs));
          return;
        }
        if (result.kind === "stop") {
          setActivityRef.current(
            autoRef.current.hunt
              ? { kind: "hunt", id: activeHunt, paused: true }
              : null,
          );
          return;
        }
        const fight = result.report;
        pending = fight;
        lastFoe = {
          creatureId: fight.creature.id,
          name: fight.creature.name,
          health: fight.creature.health,
          combat: fight.combat,
        };
        bled.last = stateRef.current.character?.health ?? 0;
        script = narrationOf({ foe: fight.creature, combat: fight.combat });
        beat = 0;
        markHuntReadyIn(script.length * HUNT_TICK_MS);
        push(null);
      });
    };

    const startCooldown = (left = CYCLE_OPTOUT_SECS) => {
      const until = new Date(Date.now() + left * 1000).toISOString();
      syncProgressRef.current({ beat: 0, cooldownUntil: until });
      push(left);
      if (coolTimer) window.clearInterval(coolTimer);
      coolTimer = window.setInterval(() => {
        const remaining = cooldownLeft({ cooldownUntil: until } as Activity);
        if (remaining <= 0) {
          window.clearInterval(coolTimer);
          coolTimer = 0;
          startLap();
        } else {
          push(remaining);
        }
      }, 250);
    };

    startLap();
    const stopDrift = createDriftLoop({
      periodMs: HUNT_TICK_MS,
      catchUp: false,
      alive: () => alive,
      ready: () => !requesting && (approaching || Boolean(pending)),
      onTick: () => {
        if (approaching) {
          approachBeat += 1;
          push(null);
          if (approachBeat >= HUNT_APPROACH_TICKS) {
            approaching = false;
            fireHunt();
          }
          return;
        }
        beat += 1;
        const line = script[Math.min(beat, script.length) - 1];
        if (line?.blow === "ours") playSound(line.critical ? "crit" : "hit");
        if (line?.blow === "pet") playSound("snap");
        if (line?.blow === "theirs") playSound("hurt");
        if (line?.characterHealth !== undefined) {
          const delta = bled.last - line.characterHealth;
          if (delta > 0) {
            sufferRef.current(delta);
            bled.last = line.characterHealth;
          }
        }
        push(null);
        if (beat >= script.length) {
          const held = pending;
          if (!held) return;
          pending = null;
          landHuntRef.current();
          script = [];
          beat = 0;
          patchActivityRuntime({ lastHuntReport: held });
          if (hunterWon(held.combat)) {
            playSound("spoils");
            if (held.levelsGained > 0) playSound("levelup", 700);
            if (held.petLeveled) playSound("pet-up", 1100);
            const spoils = held.drops
              .map((drop) => drop.name + (drop.quantity > 1 ? " x" + drop.quantity : ""))
              .join(", ");
            notifyRef.current(
              held.creature.name +
                " felled: +" +
                formatNumber(held.bronze) +
                " WCoins and +" +
                formatNumber(held.experience) +
                " experience." +
                (spoils ? " Spoils: " + spoils + "." : "") +
                (held.levelsGained > 0 ? " You leveled up!" : ""),
              true,
              "Hunt",
            );
          } else if (hunterRetreated(held.combat)) {
            notifyRef.current(
              "The hunt with " + held.creature.name + " dragged on and both fell back.",
              true,
              "Hunt",
            );
          } else {
            playSound("defeat");
            notifyRef.current(
              held.creature.name + " got the better of it: the hunt paid nothing.",
              false,
              "Hunt",
            );
          }
          if (!autoRef.current.hunt) {
            setActivityRef.current(null);
            return;
          }
          startCooldown();
        }
      },
    });

    return () => {
      alive = false;
      stopDrift();
      if (coolTimer) window.clearInterval(coolTimer);
      if (fillTimer) window.clearTimeout(fillTimer);
      if (pending && !activitySync.isMirroring()) landHuntRef.current();
    };
  }, [ready, runsEngine, activity?.kind, activity?.id, activity?.paused]);

  useEffect(() => {
    if (!ready || !runsEngine) return;
    const paused = activity?.paused === true;
    const activeExercise =
      activity?.kind === "train" && !paused && activity.id ? activity.id : null;

    if (!activeExercise) {
      patchRuntime({ train: null });
      return;
    }

    if (activeExercise === PET_EXERCISE_ID && stateRef.current.pet === null) {
      setActivityRef.current(null);
      return;
    }

    let alive = true;
    let stopBar: (() => void) | null = null;
    let retryTimer = 0;
    let coolTimer = 0;
    let carry =
      activityRef.current?.kind === "train" && activityRef.current.id === activeExercise
        ? (activityRef.current.beat ?? 0)
        : 0;
    let beat = 0;
    let ticks = resolveTrainingSessionTicks(activeExercise, carry, activityRef.current);
    let resumable = true;

    const push = (cooldown: number | null) => {
      const exercises = listExercises(stateRef.current);
      if (activeExercise === PET_EXERCISE_ID) {
        resumable = stateRef.current.pet !== null;
      } else {
        const entry = exercises.find((row) => row.exercise.id === activeExercise);
        resumable = entry ? !entry.maxed : false;
      }
      const label =
        activeExercise === PET_EXERCISE_ID
          ? "Wolf training"
          : (exercises.find((row) => row.exercise.id === activeExercise)?.exercise.name ??
            "Training");
      patchRuntime({
        train: { id: activeExercise, beat, max: ticks, cooldown },
        dock: dockOf("train", label, "Session under way", beat, ticks, cooldown),
      });
    };

    const startBar = () => {
      ticks = resolveTrainingSessionTicks(activeExercise, carry, activityRef.current);
      beat = Math.min(carry, Math.max(0, ticks - 1));
      carry = 0;
      syncProgressRef.current({ beat, cooldownUntil: null, laps: ticks });
      push(null);
      stopBar?.();
      stopBar = createDriftLoop({
        periodMs: TRAINING_TICK_MS,
        catchUp: false,
        alive: () => alive,
        ready: () => true,
        onTick: () => {
          beat += 1;
          syncProgressRef.current({ beat, cooldownUntil: null });
          push(null);
          if (beat < ticks) {
            const effort = activeExercise === PET_EXERCISE_ID ? "growl" : activeExercise;
            if (isGameSound(effort)) playSound(effort);
            return;
          }
          stopBar?.();
          stopBar = null;
          const settle = () => {
            void trainRef.current(activeExercise).then((landed) => {
              if (!alive) return;
              if (landed === "retry") {
                retryTimer = window.setTimeout(settle, TRAINING_TICK_MS);
                return;
              }
              if (landed) {
                if (landed.raised) {
                  playSound(activeExercise === PET_EXERCISE_ID ? "pet-up" : "point");
                }
              }
              beat = 0;
              syncProgressRef.current({ beat: 0, cooldownUntil: null, laps: 0 });
              if (!landed) {
                setActivityRef.current(
                  autoRef.current.train && resumable
                    ? { kind: "train", id: activeExercise, paused: true }
                    : null,
                );
                return;
              }
              if (!autoRef.current.train) {
                setActivityRef.current(null);
                return;
              }
              startCooldown(CYCLE_OPTOUT_SECS);
            });
          };
          settle();
        },
      });
    };

    const startCooldown = (left = CYCLE_OPTOUT_SECS) => {
      const until = new Date(Date.now() + left * 1000).toISOString();
      syncProgressRef.current({ beat: 0, cooldownUntil: until });
      push(left);
      if (coolTimer) window.clearInterval(coolTimer);
      coolTimer = window.setInterval(() => {
        const remaining = cooldownLeft({ cooldownUntil: until } as Activity);
        if (remaining <= 0) {
          window.clearInterval(coolTimer);
          coolTimer = 0;
          startBar();
        } else {
          push(remaining);
        }
      }, 250);
    };

    const resumeCooldown = cooldownLeft(activityRef.current);
    if (resumeCooldown > 0) startCooldown(resumeCooldown);
    else startBar();
    return () => {
      alive = false;
      stopBar?.();
      if (retryTimer) window.clearTimeout(retryTimer);
      if (coolTimer) window.clearInterval(coolTimer);
    };
  }, [ready, runsEngine, activity?.kind, activity?.id, activity?.paused]);

  useEffect(() => {
    if (!ready || !runsEngine) return;
    const paused = activity?.paused === true;
    const activeOre = activity?.kind === "mine" && !paused && activity.id ? activity.id : null;

    if (!activeOre) {
      patchRuntime({ mine: null });
      return;
    }

    let alive = true;
    let stopBar: (() => void) | null = null;
    let retryTimer = 0;
    let coolTimer = 0;
    let carry =
      activityRef.current?.kind === "mine" && activityRef.current.id === activeOre
        ? (activityRef.current.beat ?? 0)
        : 0;
    let beat = 0;
    let ticks = resolveMiningSwingTicks(activeOre, carry, activityRef.current);

    const push = (cooldown: number | null) => {
      const name = findItem(activeOre)?.name ?? "Mine";
      patchActivityRuntime({
        mine: { id: activeOre, beat, max: ticks, cooldown },
        dock: dockOf("mine", "Mining · " + name, "Pick strike", beat, ticks, cooldown),
      });
    };

    const startBar = () => {
      ticks = resolveMiningSwingTicks(activeOre, carry, activityRef.current);
      beat = Math.min(carry, Math.max(0, ticks - 1));
      carry = 0;
      syncProgressRef.current({ beat, cooldownUntil: null, laps: ticks });
      push(null);
      stopBar?.();
      stopBar = createDriftLoop({
        periodMs: MINING_TICK_MS,
        catchUp: false,
        alive: () => alive,
        ready: () => true,
        onTick: () => {
          beat += 1;
          syncProgressRef.current({ beat, cooldownUntil: null });
          playSound("mine");
          push(null);
          if (beat < ticks) return;
          stopBar?.();
          stopBar = null;
          const settle = () => {
            void mineRef.current(activeOre).then((mined) => {
              if (!alive) return;
              if (mined === "retry") {
                retryTimer = window.setTimeout(settle, MINING_TICK_MS);
                return;
              }
              beat = 0;
              syncProgressRef.current({ beat: 0, cooldownUntil: null, laps: 0 });
              if (!mined) {
                setActivityRef.current(null);
                return;
              }
              if (!autoRef.current.mine) {
                setActivityRef.current(null);
                return;
              }
              startCooldown(CYCLE_OPTOUT_SECS);
            });
          };
          settle();
        },
      });
    };

    const startCooldown = (left = CYCLE_OPTOUT_SECS) => {
      const until = new Date(Date.now() + left * 1000).toISOString();
      syncProgressRef.current({ beat: 0, cooldownUntil: until });
      push(left);
      if (coolTimer) window.clearInterval(coolTimer);
      coolTimer = window.setInterval(() => {
        const remaining = cooldownLeft({ cooldownUntil: until } as Activity);
        if (remaining <= 0) {
          window.clearInterval(coolTimer);
          coolTimer = 0;
          startBar();
        } else {
          push(remaining);
        }
      }, 250);
    };

    const resumeCooldown = cooldownLeft(activityRef.current);
    if (resumeCooldown > 0) startCooldown(resumeCooldown);
    else startBar();
    return () => {
      alive = false;
      stopBar?.();
      if (retryTimer) window.clearTimeout(retryTimer);
      if (coolTimer) window.clearInterval(coolTimer);
    };
  }, [ready, runsEngine, activity?.kind, activity?.id, activity?.paused]);

  useEffect(() => {
    if (!ready || !runsEngine) return;
    const paused = activity?.paused === true;
    const activeItem =
      activity?.kind === "forge" && !paused && activity.id ? activity.id : null;

    if (!activeItem) {
      patchRuntime({ forge: null });
      forgeItemRef.current = null;
      return;
    }

    if (activeItem !== forgeItemRef.current) {
      forgeItemRef.current = activeItem;
      forgeLevelRef.current =
        activityRef.current?.kind === "forge" && activityRef.current.id === activeItem
          ? (activityRef.current.enhancement ?? 0)
          : 0;
    }

    let alive = true;
    let stopBar: (() => void) | null = null;
    let retryTimer = 0;
    let coolTimer = 0;
    let carry =
      activityRef.current?.kind === "forge" && activityRef.current.id === activeItem
        ? (activityRef.current.beat ?? 0)
        : 0;
    let beat = 0;
    let level = forgeLevelRef.current;

    const push = (cooldown: number | null) => {
      const slot = findForgePiece(stateRef.current, activeItem, level);
      const name = slot?.item.name ?? activeItem;
      patchActivityRuntime({
        forge: { id: activeItem, beat, max: FORGE_TICKS, cooldown, level },
        dock: dockOf(
          "forge",
          "Forging · " + name,
          "Level +" + formatNumber(level) + " → +" + formatNumber(level + 1),
          beat,
          FORGE_TICKS,
          cooldown,
        ),
      });
    };

    const startBar = () => {
      const tickMs = forgeDurationMs(level) / FORGE_TICKS;
      beat = Math.min(carry, Math.max(0, FORGE_TICKS - 1));
      carry = 0;
      syncProgressRef.current({ beat, cooldownUntil: null });
      push(null);
      stopBar?.();
      stopBar = createDriftLoop({
        periodMs: tickMs,
        catchUp: false,
        alive: () => alive,
        ready: () => true,
        onTick: () => {
          beat += 1;
          syncProgressRef.current({ beat, cooldownUntil: null });
          push(null);
          if (beat < FORGE_TICKS) {
            playSound("forge");
            return;
          }
          stopBar?.();
          stopBar = null;
          const settle = () => {
            void enhanceRef.current(activeItem, level).then((landed) => {
              if (!alive) return;
              if (landed === "retry") {
                retryTimer = window.setTimeout(settle, 400);
                return;
              }
              if (landed) {
                if (landed.message) notifyRef.current(landed.message, true, "Anvil");
                playSound(landed.raised ? "point" : "denied");
                if (landed.raised) {
                  level += 1;
                  forgeLevelRef.current = level;
                  const current = activityRef.current;
                  if (current?.kind === "forge" && current.id === activeItem) {
                    persistActivityRef.current({ ...current, enhancement: level, beat: 0 });
                  }
                }
              }
              beat = 0;
              syncProgressRef.current({ beat: 0, cooldownUntil: null });
              if (!landed) {
                setActivityRef.current(
                  autoRef.current.forge
                    ? { kind: "forge", id: activeItem, enhancement: level, paused: true }
                    : null,
                );
                return;
              }
              if (level >= MAX_ENHANCEMENT || !autoRef.current.forge) {
                setActivityRef.current(null);
                return;
              }
              startCooldown(CYCLE_OPTOUT_SECS);
            });
          };
          settle();
        },
      });
    };

    const startCooldown = (left = CYCLE_OPTOUT_SECS) => {
      const until = new Date(Date.now() + left * 1000).toISOString();
      syncProgressRef.current({ beat: 0, cooldownUntil: until });
      push(left);
      if (coolTimer) window.clearInterval(coolTimer);
      coolTimer = window.setInterval(() => {
        const remaining = cooldownLeft({ cooldownUntil: until } as Activity);
        if (remaining <= 0) {
          window.clearInterval(coolTimer);
          coolTimer = 0;
          startBar();
        } else {
          push(remaining);
        }
      }, 250);
    };

    const resumeCooldown = cooldownLeft(activityRef.current);
    if (resumeCooldown > 0) startCooldown(resumeCooldown);
    else startBar();
    return () => {
      alive = false;
      stopBar?.();
      if (retryTimer) window.clearTimeout(retryTimer);
      if (coolTimer) window.clearInterval(coolTimer);
    };
  }, [ready, runsEngine, activity?.kind, activity?.id, activity?.paused]);

  // The cauldron runs the same resolve-at-end lap the anvil runs: the earlier
  // beats are theatre, the last one is the single server call that spends the
  // flask and the ingredients and mints the potion.
  useEffect(() => {
    if (!ready || !runsEngine) return;
    const paused = activity?.paused === true;
    const activePotion =
      activity?.kind === "alchemy" && !paused && activity.id ? activity.id : null;

    if (!activePotion) {
      patchRuntime({ alchemy: null });
      return;
    }

    let alive = true;
    let stopBar: (() => void) | null = null;
    let retryTimer = 0;
    let coolTimer = 0;
    let carry =
      activityRef.current?.kind === "alchemy" && activityRef.current.id === activePotion
        ? (activityRef.current.beat ?? 0)
        : 0;
    let beat = 0;

    const push = (cooldown: number | null) => {
      const name = findItem(activePotion)?.name ?? "Potion";
      patchActivityRuntime({
        alchemy: { id: activePotion, beat, max: ALCHEMY_TICKS, cooldown },
        dock: dockOf(
          "alchemy",
          "Brewing · " + name,
          "The cauldron works",
          beat,
          ALCHEMY_TICKS,
          cooldown,
        ),
      });
    };

    const startCooldown = (left = CYCLE_OPTOUT_SECS) => {
      const until = new Date(Date.now() + left * 1000).toISOString();
      syncProgressRef.current({ beat: 0, cooldownUntil: until });
      push(left);
      if (coolTimer) window.clearInterval(coolTimer);
      coolTimer = window.setInterval(() => {
        const remaining = cooldownLeft({ cooldownUntil: until } as Activity);
        if (remaining <= 0) {
          window.clearInterval(coolTimer);
          coolTimer = 0;
          startBar();
        } else {
          push(remaining);
        }
      }, 250);
    };

    const startBar = () => {
      beat = Math.min(carry, Math.max(0, ALCHEMY_TICKS - 1));
      carry = 0;
      syncProgressRef.current({ beat, cooldownUntil: null });
      push(null);
      stopBar?.();
      stopBar = createDriftLoop({
        periodMs: ALCHEMY_TICK_MS,
        catchUp: false,
        alive: () => alive,
        ready: () => true,
        onTick: () => {
          beat += 1;
          syncProgressRef.current({ beat, cooldownUntil: null });
          push(null);
          if (beat < ALCHEMY_TICKS) {
            playSound("brew");
            return;
          }
          stopBar?.();
          stopBar = null;
          const settle = () => {
            const picks = loadBrewPicks()[activePotion];
            if (!picks) {
              setActivityRef.current(null);
              return;
            }
            void brewRef.current(activePotion, picks.first, picks.second).then((landed) => {
              if (!alive) return;
              if (landed === "retry") {
                retryTimer = window.setTimeout(settle, 400);
                return;
              }
              beat = 0;
              syncProgressRef.current({ beat: 0, cooldownUntil: null });
              if (!landed) {
                setActivityRef.current(
                  autoRef.current.alchemy
                    ? { kind: "alchemy", id: activePotion, paused: true }
                    : null,
                );
                return;
              }
              if (landed.message) notifyRef.current(landed.message, true, "Alchemy");
              if (!autoRef.current.alchemy) {
                setActivityRef.current(null);
                return;
              }
              startCooldown(CYCLE_OPTOUT_SECS);
            });
          };
          settle();
        },
      });
    };

    const resume = cooldownLeft(activityRef.current);
    if (resume > 0) startCooldown(resume);
    else startBar();
    return () => {
      alive = false;
      stopBar?.();
      if (retryTimer) window.clearTimeout(retryTimer);
      if (coolTimer) window.clearInterval(coolTimer);
    };
  }, [ready, runsEngine, activity?.kind, activity?.id, activity?.paused]);

  useEffect(() => {
    if (!ready || !runsEngine) return;
    if (!activity) {
      clearActivityRuntime();
      return;
    }
    if (activity.kind === "rest") {
      patchActivityRuntime({
        hunt: null,
        train: null,
        mine: null,
        forge: null,
        alchemy: null,
        dock: restDock(activity),
      });
      return;
    }
    if (activity.paused) {
      patchActivityRuntime({
        hunt: null,
        train: null,
        mine: null,
        forge: null,
        alchemy: null,
        dock: pausedDock(stateRef.current, activity),
      });
      return;
    }
    const current = activityRuntimeStore.snapshot().dock;
    if (!current || current.kind !== activity.kind) {
      patchActivityRuntime({ dock: placeholderDock(stateRef.current, activity) });
    }
  }, [ready, runsEngine, activity]);

  return null;
}
