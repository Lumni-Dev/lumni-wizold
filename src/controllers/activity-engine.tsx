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
import { loadHuntSelection } from "@/models/repositories/hunt-selection.repository";
import type { Activity } from "@/models/entities/activity";
import type { GameState } from "@/models/entities/game-state";
import { findItem } from "@/models/data/items";
import { TERRITORIES } from "@/models/data/territories";
import { forgeDurationMs } from "@/models/rules/forge";
import { miningSwingTicks } from "@/models/rules/mining";
import { trainingSessionTicks } from "@/models/rules/training";
import {
  CYCLE_OPTOUT_SECS,
  FORGE_TICKS,
  HUNT_TICK_MS,
  MAX_ENHANCEMENT,
  MINING_TICK_MS,
  PET_EXERCISE_ID,
  TRAINING_TICKS_MIN,
  TRAINING_TICK_MS,
} from "@/shared/constants/game";
import { formatNumber } from "@/shared/utils/format";
import { narrationOf } from "@/views/presenters/hunt.presenter";
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

function resolveTrainingSessionTicks(exerciseId: string, carry: number): number {
  const prior = activityRuntimeStore.snapshot().train;
  if (
    prior?.id === exerciseId &&
    prior.max >= TRAINING_TICKS_MIN &&
    (carry > 0 || (prior.beat > 0 && prior.beat < prior.max))
  ) {
    return prior.max;
  }
  return trainingSessionTicks();
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
  return TERRITORIES.find((entry) => entry.id === id)?.name ?? "Caçada";
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

function pausedDock(state: GameState, activity: Activity): ActivityDockView {
  const name =
    activity.kind === "hunt" && activity.id
      ? territoryName(activity.id)
      : activity.kind === "mine" && activity.id
        ? (findItem(activity.id)?.name ?? "Mina")
        : activity.kind === "forge" && activity.id
          ? (findForgePiece(state, activity.id, activity.enhancement ?? 0)?.item.name ?? "Peça")
          : null;
  const titles: Record<ActivityDockView["kind"], string> = {
    hunt: "Caçada pausada",
    train: "Treino pausado",
    mine: "Mina pausada",
    forge: "Forja pausada",
    rest: "Recuperando-se",
  };
  const details: Record<ActivityDockView["kind"], string> = {
    hunt: "Esperando vida ou poção para continuar",
    train: "Esperando WCoins para continuar",
    mine: "Esperando fôlego para voltar a minerar",
    forge: "Esperando fragmentos e WCoins para a próxima martelada",
    rest: "O corpo descansa.",
  };
  const prefix = name ? name + " · " : "";
  const trainDetail =
    activity.kind === "train" && activity.id === PET_EXERCISE_ID
      ? "Esperando WCoins para continuar"
      : activity.kind === "train"
        ? "Esperando para continuar"
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
    notify,
  } = useGame();

  const activityRef = useRef(activity);
  activityRef.current = activity;

  const stateRef = useRef(state);
  const autoRef = useRef(state.automation);
  const huntRef = useRef(hunt);
  const landHuntRef = useRef(landHunt);
  const sufferRef = useRef(sufferBlow);
  const trainRef = useRef(train);
  const mineRef = useRef(mine);
  const enhanceRef = useRef(enhance);
  const notifyRef = useRef(notify);
  const setActivityRef = useRef(setActivity);
  const syncProgressRef = useRef(syncProgress);
  const persistActivityRef = useRef(persistActivity);
  const forgeLevelRef = useRef(0);
  const forgeItemRef = useRef<string | null>(null);

  useEffect(() => {
    stateRef.current = state;
    autoRef.current = state.automation;
    huntRef.current = hunt;
    landHuntRef.current = landHunt;
    sufferRef.current = sufferBlow;
    trainRef.current = train;
    mineRef.current = mine;
    enhanceRef.current = enhance;
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
    let script: ReturnType<typeof narrationOf> = [];
    let pending: HuntReport | null = null;
    let requesting = false;
    const bled = { last: stateRef.current.character?.health ?? 0 };
    const selection = loadHuntSelection();

    const push = (cooldown: number | null) => {
      const max = Math.max(1, script.length);
      const line = script[Math.min(beat, script.length) - 1];
      const detail =
        pending && beat > 0 && line
          ? line.text.slice(0, 72) + (line.text.length > 72 ? "…" : "")
          : pending
            ? "Preparando a emboscada"
            : "Rastreando a presa";
      patchActivityRuntime({
        hunt: {
          territoryId: activeHunt,
          beat,
          script,
          pending,
          cooldown,
        },
        dock: dockOf(
          "hunt",
          "Caçando · " + territoryName(activeHunt),
          detail,
          beat,
          max,
          cooldown,
        ),
      });
    };

    const resolve = () => {
      beat = 0;
      script = [];
      pending = null;
      requesting = true;
      push(null);
      const wait = huntReadyInMs();
      if (wait > 0) {
        fillTimer = window.setTimeout(resolve, wait);
        return;
      }
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
          fillTimer = window.setTimeout(resolve, Math.max(HUNT_TICK_MS, result.retryAfterMs));
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
        bled.last = stateRef.current.character?.health ?? 0;
        script = narrationOf({ foe: fight.creature, combat: fight.combat });
        beat = 0;
        markHuntReadyIn(script.length * HUNT_TICK_MS);
        push(null);
        fillTimer = window.setTimeout(() => {
          requesting = false;
        }, HUNT_TICK_MS);
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
          resolve();
        } else {
          push(remaining);
        }
      }, 250);
    };

    resolve();
    const stopDrift = createDriftLoop({
      periodMs: HUNT_TICK_MS,
      catchUp: false,
      alive: () => alive,
      ready: () => Boolean(pending) && !requesting,
      onTick: () => {
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
          if (held.combat.victory) {
            playSound("spoils");
            if (held.levelsGained > 0) playSound("levelup", 700);
            if (held.petLeveled) playSound("pet-up", 1100);
            const spoils = held.drops
              .map((drop) => drop.name + (drop.quantity > 1 ? " x" + drop.quantity : ""))
              .join(", ");
            notifyRef.current(
              held.creature.name +
                " abatido: +" +
                formatNumber(held.bronze) +
                " WCoins e +" +
                formatNumber(held.experience) +
                " de experiência." +
                (spoils ? " Espólio: " + spoils + "." : "") +
                (held.levelsGained > 0 ? " Você subiu de nível!" : ""),
              true,
              "Caça",
            );
          } else if (held.combat.retreated) {
            notifyRef.current(
              "A caçada com " + held.creature.name + " se arrastou e os dois recuaram.",
              true,
              "Caça",
            );
          } else {
            playSound("defeat");
            notifyRef.current(
              held.creature.name + " levou a melhor: a caçada não pagou nada.",
              false,
              "Caça",
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
    let ticks = resolveTrainingSessionTicks(activeExercise, carry);
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
          ? "Treino do lobo"
          : (exercises.find((row) => row.exercise.id === activeExercise)?.exercise.name ??
            "Treino");
      patchRuntime({
        train: { id: activeExercise, beat, max: ticks, cooldown },
        dock: dockOf("train", label, "Sessão em andamento", beat, ticks, cooldown),
      });
    };

    const startBar = () => {
      ticks = resolveTrainingSessionTicks(activeExercise, carry);
      beat = Math.min(carry, Math.max(0, ticks - 1));
      carry = 0;
      syncProgressRef.current({ beat, cooldownUntil: null });
      push(null);
      stopBar?.();
      stopBar = createDriftLoop({
        periodMs: TRAINING_TICK_MS,
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
                if (landed.message) notifyRef.current(landed.message, true, "Treino");
                if (landed.raised) {
                  playSound(activeExercise === PET_EXERCISE_ID ? "pet-up" : "point");
                }
              }
              beat = 0;
              syncProgressRef.current({ beat: 0, cooldownUntil: null });
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
    let ticks = miningSwingTicks();

    const push = (cooldown: number | null) => {
      const name = findItem(activeOre)?.name ?? "Mina";
      patchActivityRuntime({
        mine: { id: activeOre, beat, max: ticks, cooldown },
        dock: dockOf("mine", "Minerando · " + name, "Golpe da picareta", beat, ticks, cooldown),
      });
    };

    const startBar = () => {
      ticks = miningSwingTicks();
      beat = Math.min(carry, Math.max(0, ticks - 1));
      carry = 0;
      syncProgressRef.current({ beat, cooldownUntil: null });
      push(null);
      stopBar?.();
      stopBar = createDriftLoop({
        periodMs: MINING_TICK_MS,
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
              syncProgressRef.current({ beat: 0, cooldownUntil: null });
              if (!mined) {
                setActivityRef.current(
                  autoRef.current.mine ? { kind: "mine", id: activeOre, paused: true } : null,
                );
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
          "Forjando · " + name,
          "Nível +" + formatNumber(level) + " → +" + formatNumber(level + 1),
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
                if (landed.message) notifyRef.current(landed.message, true, "Bigorna");
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
        dock: dockOf("rest", "Recuperando-se", "O corpo descansa", 0, 1, null, true),
      });
      return;
    }
    if (activity.paused) {
      patchActivityRuntime({
        hunt: null,
        train: null,
        mine: null,
        forge: null,
        dock: pausedDock(stateRef.current, activity),
      });
      return;
    }
  }, [ready, activity]);

  return null;
}
