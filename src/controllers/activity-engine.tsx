"use client";

import { useEffect, useRef } from "react";
import { findForgePiece } from "@/controllers/forge.controller";
import { listTerritories, resolveHuntCreatureId } from "@/controllers/hunt.controller";
import { listExercises } from "@/controllers/training.controller";
import { loadHuntSelection } from "@/models/repositories/hunt-selection.repository";
import { findItem } from "@/models/data/items";
import { TERRITORIES } from "@/models/data/territories";
import { forgeDurationMs } from "@/models/rules/forge";
import {
  CYCLE_OPTOUT_SECS,
  FORGE_TICKS,
  HUNT_TICK_MS,
  MAX_ENHANCEMENT,
  MINING_TICK_MS,
  MINING_TICKS,
  PET_EXERCISE_ID,
  TRAINING_TICK_MS,
  TRAINING_TICKS,
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
      patchActivityRuntime({ hunt: null });
      return;
    }

    let alive = true;
    let coolTimer = 0;
    let fillTimer = 0;
    let beat = 0;
    let script: ReturnType<typeof narrationOf> = [];
    let pending: Awaited<ReturnType<typeof hunt>> | null = null;
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
      const row = listTerritories(stateRef.current).find(
        (entry) => entry.territory.id === activeHunt,
      );
      const creatureId = row
        ? resolveHuntCreatureId(row.creatures, row.prey, selection[activeHunt])
        : selection[activeHunt];
      void huntRef.current(activeHunt, creatureId || undefined).then((fight) => {
        if (!alive) return;
        requesting = false;
        if (!fight) {
          setActivityRef.current(
            autoRef.current.hunt && autoRef.current.potion
              ? { kind: "hunt", id: activeHunt, paused: true }
              : null,
          );
          return;
        }
        pending = fight;
        bled.last = stateRef.current.character?.health ?? 0;
        script = narrationOf({ foe: fight.creature, combat: fight.combat });
        beat = 0;
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
    };
  }, [ready, activity?.kind, activity?.id, activity?.paused]);

  useEffect(() => {
    if (!ready) return;
    const paused = activity?.paused === true;
    const activeExercise =
      activity?.kind === "train" && !paused && activity.id ? activity.id : null;

    if (!activeExercise) {
      patchActivityRuntime({ train: null });
      return;
    }

    if (activeExercise === PET_EXERCISE_ID && stateRef.current.pet === null) {
      setActivityRef.current(null);
      return;
    }

    let alive = true;
    let barTimer = 0;
    let coolTimer = 0;
    let beat = 0;
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
      patchActivityRuntime({
        train: { id: activeExercise, beat, max: TRAINING_TICKS, cooldown },
        dock: dockOf("train", label, "Sessão em andamento", beat, TRAINING_TICKS, cooldown),
      });
    };

    const startBar = () => {
      beat = 0;
      push(null);
      barTimer = window.setInterval(() => {
        beat += 1;
        push(null);
        if (beat < TRAINING_TICKS) {
          const effort = activeExercise === PET_EXERCISE_ID ? "growl" : activeExercise;
          if (isGameSound(effort)) playSound(effort);
          return;
        }
        window.clearInterval(barTimer);
        barTimer = 0;
        void trainRef.current(activeExercise).then((landed) => {
          if (!alive) return;
          if (landed) {
            if (landed.message) notifyRef.current(landed.message, true, "Treino");
            if (landed.raised) {
              playSound(activeExercise === PET_EXERCISE_ID ? "pet-up" : "point");
            }
          }
          beat = 0;
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
      patchActivityRuntime({ mine: null });
      return;
    }

    let alive = true;
    let barTimer = 0;
    let coolTimer = 0;
    let beat = 0;

    const push = (cooldown: number | null) => {
      const name = findItem(activeOre)?.name ?? "Mina";
      patchActivityRuntime({
        mine: { id: activeOre, beat, max: MINING_TICKS, cooldown },
        dock: dockOf(
          "mine",
          "Minerando · " + name,
          "Golpe da picareta",
          beat,
          MINING_TICKS,
          cooldown,
        ),
      });
    };

    const startBar = () => {
      beat = 0;
      push(null);
      barTimer = window.setInterval(() => {
        beat += 1;
        playSound("mine");
        push(null);
        if (beat < MINING_TICKS) return;
        window.clearInterval(barTimer);
        barTimer = 0;
        void mineRef.current(activeOre).then((mined) => {
          if (!alive) return;
          beat = 0;
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
      patchActivityRuntime({ forge: null });
      return;
    }

    let alive = true;
    let barTimer = 0;
    let coolTimer = 0;
    let beat = 0;
    let level = startLevel;

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
      beat = 0;
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
        void enhanceRef.current(activeItem, level).then((landed) => {
          if (!alive) return;
          if (landed) {
            if (landed.message) notifyRef.current(landed.message, true, "Bigorna");
            playSound(landed.raised ? "point" : "denied");
            if (landed.raised) level += 1;
          }
          beat = 0;
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
        dock: null,
      });
      return;
    }
  }, [ready, activity]);

  return null;
}
