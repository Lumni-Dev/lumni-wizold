"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { activityRuntimeStore } from "@/controllers/activity-runtime";
import { findForgePiece, listMining } from "@/controllers/forge.controller";
import { listTerritories, resolveHuntCreatureId } from "@/controllers/hunt.controller";
import { useGame } from "@/controllers/game.context";
import { petTrainingView } from "@/controllers/pet.controller";
import { listAttributeProgress, listExercises } from "@/controllers/training.controller";
import { dockRepository } from "@/models/repositories/dock.repository";
import { loadHuntSelection } from "@/models/repositories/hunt-selection.repository";
import { canPetFight, petLevelOf, petMaxEnergy } from "@/models/rules/pet";
import {
  FORGE_TICKS,
  MAX_ENHANCEMENT,
  MINING_TICKS,
  PET_EXERCISE_ID,
  TRAINING_TICKS,
} from "@/shared/constants/game";
import { GLASS_SECTION } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
import { ActionIcon, NavIcon } from "./app-icon";
import { Bar } from "./bar";
import { Button } from "./button";
import { CornerAccents } from "./corner-accents";
import { List, ListRow } from "./list";
import { RestSeconds } from "./rest-seconds";
import { Tooltip } from "./tooltip";
import { emphasizeDamage } from "../presenters/hunt.presenter";
import { useShake } from "./use-shake";

export function ActivityDock() {
  const pathname = usePathname();
  const { activity, state, character, stats, pet, setActivity } = useGame();
  const runtime = useSyncExternalStore(
    activityRuntimeStore.subscribe,
    activityRuntimeStore.snapshot,
    activityRuntimeStore.serverSnapshot,
  );
  const dock = runtime.dock;
  const minimized = useSyncExternalStore(
    dockRepository.subscribe,
    dockRepository.minimized,
    dockRepository.serverSnapshot,
  );

  const huntView = useMemo(() => {
    const huntRt = runtime.hunt;
    if (!huntRt || activity?.kind !== "hunt" || activity.paused) return null;
    const territory = listTerritories(state).find((row) => row.territory.id === huntRt.territoryId);
    if (!territory) return null;

    const selection = loadHuntSelection();
    const selectedId = resolveHuntCreatureId(
      territory.creatures,
      selection[huntRt.territoryId],
    );
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

    const petAlong = pet && canPetFight(pet) ? pet : null;

    return {
      preyLabel: monsterStatus + " · " + (shownFoe?.name ?? "?"),
      preyCurrent: monsterCurrent,
      preyMax: monsterMax,
      huntLabel: "Caçando...",
      huntCurrent: beat,
      huntMax: Math.max(1, script.length),
      glows: true,
      line,
      status,
      cooldown,
      pet: petAlong
        ? {
            label: "Mascote - Energia",
            current: petAlong.energy,
            maximum: petMaxEnergy(petLevelOf(petAlong)),
          }
        : null,
    };
  }, [activity, pet, runtime.hunt, state]);

  const trainView = useMemo(() => {
    const trainRt = runtime.train;
    if (!trainRt || activity?.kind !== "train" || activity.paused) return null;
    const cooldown = trainRt.cooldown;
    const opting = cooldown !== null;
    const petActive = trainRt.id === PET_EXERCISE_ID;
    const petTraining = petTrainingView(state);

    if (petActive && petTraining) {
      return {
        progressLabel: "Mascote - Progresso",
        progressCurrent: petTraining.progress,
        progressMax: petTraining.needed,
        sessionLabel: "Mascote - Treinamento",
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
    const forgeEntry = findForgePiece(state, forgeRt.id, forgeRt.level);
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
      beat: String(character.health),
      healthCurrent: character.health,
      healthMax: stats.maxHealth,
      glows: character.health < stats.maxHealth,
      status: "O corpo descansa.",
    };
  }, [activity, character, stats]);

  const dockVisible = Boolean(activity && dock && pathname !== dock.href);
  const [jolt, setJolt] = useState(0);
  const shaking = useShake(jolt);

  useEffect(() => {
    const huntRt = runtime.hunt;
    if (!huntRt || activity?.kind !== "hunt" || activity.paused || huntRt.beat <= 0) return;
    const line = huntRt.script[Math.min(huntRt.beat, huntRt.script.length) - 1];
    if (line?.critical) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setJolt((count) => count + 1);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [activity, runtime.hunt]);

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
  if (activity.paused) return null;
  if (pathname === dock.href) return null;

  const statusText =
    huntView?.status ??
    trainView?.status ??
    mineView?.status ??
    forgeView?.status ??
    restView?.status ??
    dock.detail;

  const runningLabel = huntView
    ? "Caçando..."
    : trainView
      ? "Treinando..."
      : mineView
        ? "Minerando..."
        : forgeView
          ? "Forjando..."
          : restView
            ? "Recuperando-se..."
            : dock.detail;

  const stopLabel =
    dock.canStop && dock.cooldown !== null
      ? "Parar (" + dock.cooldown + ")"
      : dock.canStop
        ? "Parar"
        : runningLabel;

  return (
    <aside aria-label="Atividade em andamento" className="pointer-events-auto relative w-full">
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-edge shadow-[0_12px_32px_-12px_rgba(0,0,0,0.95)]",
          GLASS_SECTION,
          shaking && "card-shake",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2",
            !minimized && "border-b border-edge",
          )}
        >
          <NavIcon href={dock.href} className="shrink-0 text-ink-faint" />
          <Link
            href={dock.href}
            className="min-w-0 flex-1 truncate text-[10px] uppercase tracking-[0.16em] text-ink"
          >
            {dock.title}
          </Link>
          <Tooltip label={minimized ? "Maximizar" : "Minimizar"}>
            <button
              type="button"
              onClick={() => dockRepository.setMinimized(!minimized)}
              aria-label={minimized ? "Maximizar atividade" : "Minimizar atividade"}
              aria-expanded={!minimized}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-edge text-ink-faint transition-colors hover:border-edge-strong hover:text-ink"
            >
              <ActionIcon action={minimized ? "expand" : "collapse"} />
            </button>
          </Tooltip>
        </div>

        {minimized ? null : (
          <>
            <List>
              {huntView ? (
                <>
                  <ListRow layout="column">
                    <Bar
                      label={huntView.preyLabel}
                      current={huntView.preyCurrent}
                      maximum={huntView.preyMax}
                      tone="blood"
                    />
                  </ListRow>
                  <ListRow layout="column">
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
                  </ListRow>
                  {huntView.pet ? (
                    <ListRow layout="column">
                      <Bar
                        label={huntView.pet.label}
                        current={huntView.pet.current}
                        maximum={huntView.pet.maximum}
                        tone="vigor"
                      />
                    </ListRow>
                  ) : null}
                  {huntView.line ? (
                    <ListRow layout="column">
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
                    </ListRow>
                  ) : null}
                </>
              ) : null}

              {trainView ? (
                <>
                  <ListRow layout="column">
                    <Bar
                      label={trainView.progressLabel}
                      current={trainView.progressCurrent}
                      maximum={trainView.progressMax}
                      wraps
                    />
                  </ListRow>
                  <ListRow layout="column">
                    <Bar
                      label={
                        trainView.cooldown !== null
                          ? "Parar em " + trainView.cooldown + "s"
                          : trainView.sessionLabel
                      }
                      current={trainView.sessionCurrent}
                      maximum={trainView.sessionMax}
                      glows={trainView.glows && trainView.cooldown === null}
                      wraps
                    />
                  </ListRow>
                </>
              ) : null}

              {mineView ? (
                <>
                  <ListRow layout="column">
                    <Bar
                      label={mineView.dailyLabel}
                      tone="tide"
                      current={mineView.dailyCurrent}
                      maximum={mineView.dailyMax}
                    />
                  </ListRow>
                  <ListRow layout="column">
                    <Bar
                      label={
                        mineView.cooldown !== null
                          ? "Parar em " + mineView.cooldown + "s"
                          : mineView.swingLabel
                      }
                      current={mineView.swingCurrent}
                      maximum={mineView.swingMax}
                      glows={mineView.glows && mineView.cooldown === null}
                      wraps
                    />
                  </ListRow>
                </>
              ) : null}

              {forgeView ? (
                <>
                  {forgeView.fragment ? (
                    <ListRow layout="column">
                      <Bar
                        label={forgeView.fragment.label}
                        tone="ember"
                        current={forgeView.fragment.current}
                        maximum={forgeView.fragment.maximum}
                      />
                    </ListRow>
                  ) : null}
                  <ListRow layout="column">
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
                  </ListRow>
                </>
              ) : null}

              {restView ? (
                <ListRow layout="column">
                  <Bar
                    label={
                      <>
                        Vida (Recuperando-se... <RestSeconds key={restView.beat} />)
                      </>
                    }
                    current={restView.healthCurrent}
                    maximum={restView.healthMax}
                    tone="blood"
                    glows={restView.glows}
                  />
                </ListRow>
              ) : null}

              {!huntView && !trainView && !mineView && !forgeView && !restView ? (
                <ListRow layout="column">
                  <Bar
                    label={dock.cooldown !== null ? "Parar em " + dock.cooldown + "s" : dock.detail}
                    current={dock.beat}
                    maximum={dock.max}
                    tone={dock.tone}
                    glows={dock.cooldown === null && dock.beat > 0}
                    wraps
                  />
                </ListRow>
              ) : null}
            </List>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-edge px-4 py-3">
              <span className="min-w-0 flex-1 truncate text-[11px] text-ink-faint">{statusText}</span>
              <Button
                variant={dock.canStop ? "secondary" : "outline"}
                disabled={!dock.canStop}
                onClick={() => setActivity(null)}
                aria-label={dock.canStop ? "Parar atividade" : runningLabel}
              >
                {stopLabel}
              </Button>
            </div>
          </>
        )}
      </div>
      <CornerAccents />
    </aside>
  );
}
