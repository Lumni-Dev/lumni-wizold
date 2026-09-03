"use client";

import { useEffect, useRef } from "react";
import { findForgePiece } from "@/controllers/forge.controller";
import {
  listTerritories,
  resolveHuntCreatureId,
  type HuntReport,
} from "@/controllers/hunt.controller";
import { listExercises } from "@/controllers/training.controller";
import { loadHuntSelection } from "@/models/repositories/hunt-selection.repository";
import { progressRepository } from "@/models/repositories/progress.repository";
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
  TRAINING_TICK_MS,
} from "@/shared/constants/game";
import { formatNumber } from "@/shared/utils/format";
import { narrationOf } from "@/views/presenters/hunt.presenter";
import { isGameSound, playSound } from "./sound";
import { useGame } from "./game.context";
import {
  activityHref,
  activityTone,
  clearActivityRuntime,
  patchActivityRuntime,
  type ActivityDockView,
} from "./activity-runtime";
import { activityMirrorStore } from "./activity-sync";

function idleRuntime(patch: Parameters<typeof patchActivityRuntime>[0]): void {
  if (activityMirrorStore.snapshot()) return;
  patchActivityRuntime(patch);
}

const HUNT_READY_KEY = "lumni-wizold:hunt-ready";

function huntReadyInMs(): number {
  if (typeof window === "undefined") return 0;
  const at = Number(window.sessionStorage.getItem(HUNT_READY_KEY));
  if (!Number.isFinite(at)) return 0;
  return Math.max(0, Math.ceil(at - Date.now()));
}

function markHuntReadyIn(ms: number): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(HUNT_READY_KEY, String(Date.now() + Math.max(0, ms)));
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
  const {
    ready,
    activity,
    setActivity,
    state,
    hunt,
    landHunt,
    sufferBlow,
    train,
    mine,
    enhance,
    notify,
  } = useGame();

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
  });

  useEffect(() => {
    if (!ready) return;
    const paused = activity?.paused === true;
    const activeHunt =
      activity?.kind === "hunt" && !paused && activity.id ? activity.id : null;

    if (!activeHunt) {
      idleRuntime({ hunt: null });
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

    const startCooldown = () => {
      let left = CYCLE_OPTOUT_SECS;
      push(left);
      coolTimer = window.setInterval(() => {
        left -= 1;
        if (left <= 0) {
          window.clearInterval(coolTimer);
          coolTimer = 0;
          resolve();
        } else {
          push(left);
        }
      }, 1000);
    };

    resolve();
    const timer = window.setInterval(() => {
      if (!pending || requesting) return;
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
    }, HUNT_TICK_MS);

    return () => {
      alive = false;
      window.clearInterval(timer);
      if (coolTimer) window.clearInterval(coolTimer);
      if (fillTimer) window.clearTimeout(fillTimer);
      if (pending) landHuntRef.current();
    };
  }, [ready, activity?.kind, activity?.id, activity?.paused]);

  useEffect(() => {
    if (!ready) return;
    const paused = activity?.paused === true;
    const activeExercise =
      activity?.kind === "train" && !paused && activity.id ? activity.id : null;

    if (!activeExercise) {
      idleRuntime({ train: null });
      return;
    }

    if (activeExercise === PET_EXERCISE_ID && stateRef.current.pet === null) {
      setActivityRef.current(null);
      return;
    }

    let alive = true;
    let barTimer = 0;
    let coolTimer = 0;
    const bank = "train:" + activeExercise;
    let carry = progressRepository.get(bank, trainingSessionTicks());
    let beat = 0;
    let ticks = trainingSessionTicks();
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
      progressRepository.set(bank, beat);
      patchActivityRuntime({
        train: { id: activeExercise, beat, max: ticks, cooldown },
        dock: dockOf("train", label, "Sessão em andamento", beat, ticks, cooldown),
      });
    };

    const startBar = () => {
      ticks = trainingSessionTicks();
      beat = Math.min(carry, Math.max(0, ticks - 1));
      carry = 0;
      push(null);
      barTimer = window.setInterval(() => {
        beat += 1;
        push(null);
        if (beat < ticks) {
          const effort = activeExercise === PET_EXERCISE_ID ? "growl" : activeExercise;
          if (isGameSound(effort)) playSound(effort);
          return;
        }
        window.clearInterval(barTimer);
        barTimer = 0;
        const settle = () => {
          void trainRef.current(activeExercise).then((landed) => {
            if (!alive) return;
            if (landed === "retry") {
              barTimer = window.setTimeout(settle, TRAINING_TICK_MS);
              return;
            }
            if (landed) {
              if (landed.message) notifyRef.current(landed.message, true, "Treino");
              if (landed.raised) {
                playSound(activeExercise === PET_EXERCISE_ID ? "pet-up" : "point");
              }
            }
            beat = 0;
            progressRepository.clear(bank);
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
            startCooldown();
          });
        };
        settle();
      }, TRAINING_TICK_MS);
    };

    const startCooldown = () => {
      let left = CYCLE_OPTOUT_SECS;
      push(left);
      coolTimer = window.setInterval(() => {
        left -= 1;
        if (left <= 0) {
          window.clearInterval(coolTimer);
          coolTimer = 0;
          startBar();
        } else {
          push(left);
        }
      }, 1000);
    };

    startBar();
    return () => {
      alive = false;
      if (barTimer) window.clearInterval(barTimer);
      if (coolTimer) window.clearInterval(coolTimer);
    };
  }, [ready, activity?.kind, activity?.id, activity?.paused]);

  useEffect(() => {
    if (!ready) return;
    const paused = activity?.paused === true;
    const activeOre = activity?.kind === "mine" && !paused && activity.id ? activity.id : null;

    if (!activeOre) {
      idleRuntime({ mine: null });
      return;
    }

    let alive = true;
    let barTimer = 0;
    let coolTimer = 0;
    const bank = "mine:" + activeOre;
    let carry = progressRepository.get(bank, miningSwingTicks());
    let beat = 0;
    let ticks = miningSwingTicks();

    const push = (cooldown: number | null) => {
      const name = findItem(activeOre)?.name ?? "Mina";
      progressRepository.set(bank, beat);
      patchActivityRuntime({
        mine: { id: activeOre, beat, max: ticks, cooldown },
        dock: dockOf("mine", "Minerando · " + name, "Golpe da picareta", beat, ticks, cooldown),
      });
    };

    const startBar = () => {
      ticks = miningSwingTicks();
      beat = Math.min(carry, Math.max(0, ticks - 1));
      carry = 0;
      push(null);
      barTimer = window.setInterval(() => {
        beat += 1;
        playSound("mine");
        push(null);
        if (beat < ticks) return;
        window.clearInterval(barTimer);
        barTimer = 0;
        const settle = () => {
          void mineRef.current(activeOre).then((mined) => {
            if (!alive) return;
            if (mined === "retry") {
              barTimer = window.setTimeout(settle, MINING_TICK_MS);
              return;
            }
            beat = 0;
            progressRepository.clear(bank);
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
            startCooldown();
          });
        };
        settle();
      }, MINING_TICK_MS);
    };

    const startCooldown = () => {
      let left = CYCLE_OPTOUT_SECS;
      push(left);
      coolTimer = window.setInterval(() => {
        left -= 1;
        if (left <= 0) {
          window.clearInterval(coolTimer);
          coolTimer = 0;
          startBar();
        } else {
          push(left);
        }
      }, 1000);
    };

    startBar();
    return () => {
      alive = false;
      if (barTimer) window.clearInterval(barTimer);
      if (coolTimer) window.clearInterval(coolTimer);
    };
  }, [ready, activity?.kind, activity?.id, activity?.paused]);

  useEffect(() => {
    if (!ready) return;
    const paused = activity?.paused === true;
    const activeItem =
      activity?.kind === "forge" && !paused && activity.id ? activity.id : null;
    const startLevel = activity?.kind === "forge" ? (activity.enhancement ?? 0) : 0;

    if (!activeItem) {
      idleRuntime({ forge: null });
      return;
    }

    let alive = true;
    let barTimer = 0;
    let coolTimer = 0;
    const bank = "forge:" + activeItem;
    let carry = progressRepository.get(bank, FORGE_TICKS);
    let beat = 0;
    let level = startLevel;

    const push = (cooldown: number | null) => {
      const slot = findForgePiece(stateRef.current, activeItem, level);
      const name = slot?.item.name ?? activeItem;
      progressRepository.set(bank, beat);
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
      push(null);
      barTimer = window.setInterval(() => {
        beat += 1;
        push(null);
        if (beat < FORGE_TICKS) {
          playSound("forge");
          return;
        }
        window.clearInterval(barTimer);
        barTimer = 0;
        const settle = () => {
          void enhanceRef.current(activeItem, level).then((landed) => {
            if (!alive) return;
            if (landed === "retry") {
              barTimer = window.setTimeout(settle, 400);
              return;
            }
            if (landed) {
              if (landed.message) notifyRef.current(landed.message, true, "Bigorna");
              playSound(landed.raised ? "point" : "denied");
              if (landed.raised) level += 1;
            }
            beat = 0;
            progressRepository.clear(bank);
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
            startCooldown();
          });
        };
        settle();
      }, tickMs);
    };

    const startCooldown = () => {
      let left = CYCLE_OPTOUT_SECS;
      push(left);
      coolTimer = window.setInterval(() => {
        left -= 1;
        if (left <= 0) {
          window.clearInterval(coolTimer);
          coolTimer = 0;
          startBar();
        } else {
          push(left);
        }
      }, 1000);
    };

    startBar();
    return () => {
      alive = false;
      if (barTimer) window.clearInterval(barTimer);
      if (coolTimer) window.clearInterval(coolTimer);
    };
  }, [ready, activity?.kind, activity?.id, activity?.enhancement, activity?.paused]);

  useEffect(() => {
    if (!ready) return;
    if (!activity) {
      if (!activityMirrorStore.snapshot()) clearActivityRuntime();
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
