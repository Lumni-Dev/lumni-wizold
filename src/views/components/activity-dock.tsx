"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { activityRuntimeStore } from "@/controllers/activity-runtime";
import { listForge, listMining } from "@/controllers/forge.controller";
import { listTerritories } from "@/controllers/hunt.controller";
import { useGame } from "@/controllers/game.context";
import { petTrainingView } from "@/controllers/pet.controller";
import { listAttributeProgress, listExercises } from "@/controllers/training.controller";
import { loadHuntSelection } from "@/models/repositories/hunt-selection.repository";
import {
  FORGE_TICKS,
  MAX_ENHANCEMENT,
  MINING_TICKS,
  PET_EXERCISE_ID,
  TRAINING_TICKS,
} from "@/shared/constants/game";
import { cn } from "@/shared/utils/class-names";
import { ActionIcon, NavIcon } from "./app-icon";
import { Bar } from "./bar";
import { Button } from "./button";
import { CornerAccents } from "./corner-accents";
import { emphasizeDamage } from "../presenters/hunt.presenter";

export function ActivityDock() {
  const pathname = usePathname();
  const { activity, state, character, stats, setActivity } = useGame();
  const runtime = useSyncExternalStore(
    activityRuntimeStore.subscribe,
    activityRuntimeStore.snapshot,
    activityRuntimeStore.serverSnapshot,
  );
  const dock = runtime.dock;

  const huntView = useMemo(() => {
    const huntRt = runtime.hunt;
    if (!huntRt || activity?.kind !== "hunt" || activity.paused) return null;
    const territory = listTerritories(state).find((row) => row.territory.id === huntRt.territoryId);
    if (!territory) return null;

    const selection = loadHuntSelection();
    const selectedId = selection[huntRt.territoryId] ?? territory.prey?.id ?? null;
    const beat = huntRt.beat;
    const script = huntRt.script;
    const pending = huntRt.pending;
    const cooldown = huntRt.cooldown;
    const line =
      beat > 0 && script.length > 0 ? script[Math.min(beat, script.length) - 1] : null;
    const replaying = pending !== null && line !== null;
    const filling = pending !== null && line === null;
    const shownFoe =
      (replaying || filling) && pending
        ? pending.creature
        : (territory.creatures.find((creature) => creature.id === selectedId) ??
          territory.prey ??
          territory.creatures[0]);
    const monsterMax = Math.max(1, shownFoe?.health ?? 1);
    const monsterCurrent =
      replaying && line
        ? Math.max(0, Math.min(monsterMax, line.creatureHealth))
        : filling
          ? monsterMax
          : 0;
    const monsterStatus = replaying ? "Atacando" : filling ? "Preparando" : "Aguardando";
    const opting = cooldown !== null;
    const status = opting
      ? "Pode parar agora ou seguir para a próxima."
      : state.automation.hunt
        ? "Caçando sem parar..."
        : "Caçando...";

    return {
      preyLabel: monsterStatus + " · " + (shownFoe?.name ?? "—"),
      preyCurrent: monsterCurrent,
      preyMax: monsterMax,
      huntLabel: "Caçando...",
      huntCurrent: beat,
      huntMax: Math.max(1, script.length),
      glows: true,
      line,
      status,
      cooldown,
    };
  }, [activity, runtime.hunt, state]);

  const trainView = useMemo(() => {
    const trainRt = runtime.train;
    if (!trainRt || activity?.kind !== "train" || activity.paused) return null;
    const cooldown = trainRt.cooldown;
    const opting = cooldown !== null;
    const petActive = trainRt.id === PET_EXERCISE_ID;
    const petTraining = petTrainingView(state);

    if (petActive && petTraining) {
      return {
        progressLabel: "Progresso",
        progressCurrent: petTraining.progress,
        progressMax: petTraining.needed,
        sessionLabel: "Treinamento",
        sessionCurrent: trainRt.beat,
        sessionMax: TRAINING_TICKS,
        glows: true,
        status: opting
          ? "Segue sozinho..."
          : state.automation.train
            ? "Treinando sem parar..."
            : "Treinando...",
        cooldown,
      };
    }

    const exercises = listExercises(state);
    const progress = listAttributeProgress(state);
    const entry = exercises.find((row) => row.exercise.id === trainRt.id);
    const row = progress.find((item) => item.key === entry?.exercise.attribute);

    return {
      progressLabel: "Progresso",
      progressCurrent: row?.progress ?? 0,
      progressMax: row?.needed ?? 1,
      sessionLabel: "Treinamento",
      sessionCurrent: trainRt.beat,
      sessionMax: TRAINING_TICKS,
      glows: true,
      status: opting
        ? "Segue sozinho..."
        : state.automation.train
          ? "Treinando sem parar..."
          : "Treinando...",
      cooldown,
    };
  }, [activity, runtime.train, state]);

  const mineView = useMemo(() => {
    const mineRt = runtime.mine;
    if (!mineRt || activity?.kind !== "mine" || activity.paused) return null;
    const mining = listMining(state);
    const cooldown = mineRt.cooldown;
    const opting = cooldown !== null;

    return {
      dailyLabel: mining.dailyExhausted ? "Fôlego da mina esgotado" : "Fôlego da mina",
      dailyCurrent: mining.dailyRemaining,
      dailyMax: mining.dailyLimit,
      swingLabel: "Minerando...",
      swingCurrent: mineRt.beat,
      swingMax: MINING_TICKS,
      glows: true,
      status: opting
        ? "Segue sozinho..."
        : state.automation.mine
          ? "Minerando sem parar..."
          : "Minerando...",
      cooldown,
    };
  }, [activity, runtime.mine, state]);

  const forgeView = useMemo(() => {
    const forgeRt = runtime.forge;
    if (!forgeRt || activity?.kind !== "forge" || activity.paused) return null;
    const slots = listForge(state);
    const forgeEntry = slots.find((row) => row.item.id === forgeRt.id) ?? null;
    const cooldown = forgeRt.cooldown;
    const opting = cooldown !== null;

    return {
      fragment:
        forgeEntry?.fragment && forgeEntry.level < MAX_ENHANCEMENT
          ? {
              label: forgeEntry.fragment.name,
              current: forgeEntry.owned,
              maximum: forgeEntry.cost,
            }
          : null,
      strikeLabel: "Forjando...",
      strikeCurrent: forgeRt.beat,
      strikeMax: FORGE_TICKS,
      glows: true,
      status: opting
        ? "Segue sozinho..."
        : state.automation.forge
          ? "Forjando sem parar..."
          : "Forjando...",
      cooldown,
    };
  }, [activity, runtime.forge, state]);

  const restView = useMemo(() => {
    if (activity?.kind !== "rest" || !character || !stats) return null;
    return {
      healthLabel: "Vida (Recuperando-se...)",
      healthCurrent: character.health,
      healthMax: stats.maxHealth,
      glows: character.health < stats.maxHealth,
      status: "O corpo descansa.",
    };
  }, [activity, character, stats]);

  const dockVisible = Boolean(activity && dock && pathname !== dock.href);

  useEffect(() => {
    if (!dockVisible || !dock) return undefined;

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      if (!dock.canStop && activity?.kind !== "rest" && !activity?.paused) return;
      event.preventDefault();
      setActivity(null);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activity, dock, dockVisible, setActivity]);

  if (!activity || !dock) return null;
  if (pathname === dock.href) return null;

  return (
    <aside aria-label="Atividade em andamento" className="pointer-events-auto relative w-full">
      <div className="overflow-hidden rounded-lg border border-edge bg-surface/80 backdrop-blur shadow-[0_12px_32px_-12px_rgba(0,0,0,0.95)]">
        <div className="flex items-center gap-2 border-b border-edge bg-surface-high/40 px-3 py-2">
          <NavIcon href={dock.href} className="shrink-0 text-ink-faint" />
          <Link
            href={dock.href}
            className="min-w-0 flex-1 truncate text-[10px] uppercase tracking-[0.16em] text-ink"
          >
            {dock.title}
          </Link>
          {dock.canStop ? (
            <Button icon variant="ghost" aria-label="Parar atividade" onClick={() => setActivity(null)}>
              <ActionIcon action="stop" />
            </Button>
          ) : null}
        </div>

        <div className="space-y-3 p-3">
          {huntView ? (
            <>
              <Bar
                label={huntView.preyLabel}
                current={huntView.preyCurrent}
                maximum={huntView.preyMax}
                tone="blood"
              />
              <Bar
                label={
                  huntView.cooldown !== null
                    ? "Parar em " + huntView.cooldown + "s"
                    : huntView.huntLabel
                }
                current={huntView.huntCurrent}
                maximum={huntView.huntMax}
                tone="blood"
                glows={huntView.glows && huntView.cooldown === null}
                wraps
              />
              {huntView.line ? (
                <p
                  className={cn(
                    "truncate font-mono text-[11px]",
                    huntView.line.critical ? "text-ember" : "text-ink-faint",
                  )}
                >
                  {emphasizeDamage(huntView.line.text).map((part, index) =>
                    typeof part === "string" ? (
                      part
                    ) : (
                      <strong
                        key={index}
                        className={cn("font-bold", !huntView.line?.critical && "text-ink")}
                      >
                        {part.damage}
                      </strong>
                    ),
                  )}
                </p>
              ) : null}
              <p className="truncate text-[11px] text-ink-faint">{huntView.status}</p>
            </>
          ) : null}

          {trainView ? (
            <>
              <Bar
                label={trainView.progressLabel}
                current={trainView.progressCurrent}
                maximum={trainView.progressMax}
                wraps
              />
              <Bar
                label={
                  trainView.cooldown !== null
                    ? "Parar em " + trainView.cooldown + "s"
                    : trainView.sessionLabel
                }
                current={trainView.sessionCurrent}
                maximum={trainView.sessionMax}
                tone="vigor"
                glows={trainView.glows && trainView.cooldown === null}
                wraps
              />
              <p className="truncate text-[11px] text-ink-faint">{trainView.status}</p>
            </>
          ) : null}

          {mineView ? (
            <>
              <Bar
                label={mineView.dailyLabel}
                tone="tide"
                current={mineView.dailyCurrent}
                maximum={mineView.dailyMax}
              />
              <Bar
                label={
                  mineView.cooldown !== null
                    ? "Parar em " + mineView.cooldown + "s"
                    : mineView.swingLabel
                }
                current={mineView.swingCurrent}
                maximum={mineView.swingMax}
                tone="tide"
                glows={mineView.glows && mineView.cooldown === null}
                wraps
              />
              <p className="truncate text-[11px] text-ink-faint">{mineView.status}</p>
            </>
          ) : null}

          {forgeView ? (
            <>
              {forgeView.fragment ? (
                <Bar
                  label={forgeView.fragment.label}
                  tone="ember"
                  current={forgeView.fragment.current}
                  maximum={forgeView.fragment.maximum}
                />
              ) : null}
              <Bar
                label={
                  forgeView.cooldown !== null
                    ? "Parar em " + forgeView.cooldown + "s"
                    : forgeView.strikeLabel
                }
                current={forgeView.strikeCurrent}
                maximum={forgeView.strikeMax}
                tone="ember"
                glows={forgeView.glows && forgeView.cooldown === null}
                wraps
              />
              <p className="truncate text-[11px] text-ink-faint">{forgeView.status}</p>
            </>
          ) : null}

          {restView ? (
            <>
              <Bar
                label={restView.healthLabel}
                current={restView.healthCurrent}
                maximum={restView.healthMax}
                tone="blood"
                glows={restView.glows}
              />
              <p className="truncate text-[11px] text-ink-faint">{restView.status}</p>
            </>
          ) : null}

          {!huntView && !trainView && !mineView && !forgeView && !restView ? (
            <Bar
              label={dock.cooldown !== null ? "Parar em " + dock.cooldown + "s" : dock.detail}
              current={dock.beat}
              maximum={dock.max}
              tone={dock.tone}
              glows={dock.cooldown === null && dock.beat > 0}
              wraps
            />
          ) : null}
        </div>
      </div>
      <CornerAccents />
    </aside>
  );
}
