"use client";

import { useEffect, useMemo } from "react";
import { activityCardStore } from "@/controllers/activity-card.store";
import { useGame } from "@/controllers/game.context";
import { petTrainingView } from "@/controllers/pet.controller";
import {
  listAttributeProgress,
  listExercises,
  trainingSummary,
} from "@/controllers/training.controller";
import { ACTIVITY_WAIT_LABEL, useActivityLock } from "@/controllers/use-activity-lock";
import { useT } from "@/controllers/use-locale";
import { useVisibleActivity } from "@/controllers/use-visible-activity";
import { findGender } from "@/models/entities/character";
import { petTotalTraining } from "@/models/rules/pet";
import { totalExperience } from "@/models/rules/progression";
import {
  BASE_ATTRIBUTE_VALUE,
  MAX_ATTRIBUTE_VALUE,
  PET_EXERCISE_ID,
  PET_MAX_LEVEL,
  TRAINING_TICKS_MAX,
  TRAINING_TICKS_MIN,
} from "@/shared/constants/game";
import { formatFraction, formatNumber, formatBronze } from "@/shared/utils/format";
import { Bar } from "../components/bar";
import { Button } from "../components/button";
import { GainDelta } from "../components/gain-delta";
import { PetArtFill } from "../components/pet-icon";
import { TrainingArtFill } from "../components/training-icon";
import { Card, CardBody, CardFooter, CardHeader } from "../components/card";
import { RowText } from "../components/list";
import { Panel } from "../components/panel";
import { PageHeader } from "../layout/page-header";

export function TrainingScreen() {
  const { state, character, stats, moon, setActivity } = useGame();
  const t = useT();
  const { locked } = useActivityLock();
  const waitLabel = locked ? ACTIVITY_WAIT_LABEL : "";
  const { activity, runtime } = useVisibleActivity();
  const trainRt = runtime.train;
  const paused = activity?.paused === true;
  const activeExercise = activity?.kind === "train" && !paused ? (activity.id ?? null) : null;
  const waitingExercise = activity?.kind === "train" && paused ? (activity.id ?? null) : null;
  const session =
    trainRt && activeExercise === trainRt.id
      ? { id: trainRt.id, beat: trainRt.beat, max: trainRt.max }
      : activeExercise
        ? {
            id: activeExercise,
            beat: activity?.kind === "train" ? (activity.beat ?? 0) : 0,
            max: TRAINING_TICKS_MIN,
          }
        : { id: "", beat: 0, max: TRAINING_TICKS_MIN };
  const cooldown = trainRt && activeExercise === trainRt.id ? trainRt.cooldown : null;

  const exercises = useMemo(() => listExercises(state), [state]);
  const progress = useMemo(() => listAttributeProgress(state), [state]);
  const petTraining = useMemo(() => petTrainingView(state), [state]);
  const petActive = activeExercise === PET_EXERCISE_ID;
  const petReady = petTraining !== null && !petTraining.maxed && petTraining.affordable;

  // Same deal as the hunt page: while the running card is scrolled out of
  // sight, the floating dock steps in; back on screen, the dock stands down.
  const focusExercise = activeExercise ?? waitingExercise;
  useEffect(() => {
    if (!focusExercise) {
      activityCardStore.set(true);
      return;
    }
    const target = document.querySelector('[data-train-card="' + focusExercise + '"]');
    if (!target) {
      activityCardStore.set(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) activityCardStore.set(entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observer.observe(target);
    return () => {
      observer.disconnect();
      activityCardStore.set(true);
    };
  }, [focusExercise]);

  if (!character || !stats) return null;

  function toggleTraining(exerciseId: string, ready: boolean) {
    if (activeExercise === exerciseId) {
      if (cooldown !== null) setActivity(null);
      return;
    }
    if (!ready) return;
    setActivity({ kind: "train", id: exerciseId });
  }

  return (
    <>
      <PageHeader
        title="Training"
        description={
          "Training is free forever: one exercise per attribute, every full bar becomes a permanent +1. Each session draws " +
          TRAINING_TICKS_MIN +
          " to " +
          TRAINING_TICKS_MAX +
          " steps, so one goes fast and the next asks for patience. You cannot stop mid-session, but between one and the next there are three seconds to call it off."
        }
      />

      <Panel
        title="Attributes"
        description={
          (state.automation.train
            ? "Training repeats on its own until you say stop, and each attribute caps at "
            : "Each click trains one session, and each attribute caps at ") +
          formatNumber(MAX_ATTRIBUTE_VALUE) +
          "."
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {exercises.map(({ exercise, effort, affordable, maxed, reason }) => {
            const row = progress.find((entry) => entry.key === exercise.attribute);
            const summary = trainingSummary(row?.value ?? 0, row?.progress ?? 0, effort);
            // Only what the yard itself conquered: the natural floor (base
            // value plus the bloodline bonus) stays out of the count.
            const natural =
              BASE_ATTRIBUTE_VALUE + (findGender(character.gender).bonus[exercise.attribute] ?? 0);
            const exactValue = row
              ? Math.max(
                  0,
                  (row.value >= MAX_ATTRIBUTE_VALUE
                    ? row.value
                    : row.value + row.progress / row.needed) - natural,
                )
              : 0;
            const ready = !maxed && affordable;
            const active = activeExercise === exercise.id;
            const opting = active && cooldown !== null;

            return (
              <div key={exercise.id} data-train-card={exercise.id}>
              <Card
                height="fill"
                interactive={active || ready}
                tone={active ? "highlighted" : "default"}
              >
                <CardHeader art={<TrainingArtFill attribute={exercise.attribute} />}>
                  <RowText
                    title={row?.name ?? exercise.name}
                    label={exercise.name}
                    description={
                      <span className="font-mono text-[11px] text-ink">
                        {t("LV.")} {formatNumber(row?.value ?? 0)}
                        <span className="text-ink-faint">
                          {" / " + formatNumber(MAX_ATTRIBUTE_VALUE)}
                        </span>
                        {(row?.value ?? 0) >= MAX_ATTRIBUTE_VALUE ? (
                          <span className="ml-1 text-[10px] text-ink-faint">{t("cap")}</span>
                        ) : null}
                      </span>
                    }
                  />
                </CardHeader>

                <CardBody>
                  <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-ink-soft">
                    <li>
                      {t("You currently have")}{" "}
                      <strong className="font-bold">{formatFraction(exactValue)}</strong>{" "}
                      {t("points of")} {row?.name ?? exercise.name}
                    </li>
                    <li>
                      <strong className="font-bold">+{formatFraction(summary.pointShare)}</strong>{" "}
                      {t("point per session")}
                    </li>
                    <li>
                      <strong className="font-bold">+{formatNumber(summary.progress)}</strong>{" "}
                      {t("experience per session")}
                      {moon.phase.trainingBonus > 0
                        ? " (+" + Math.round(moon.phase.trainingBonus * 100) + "% " + t("moon") + ")"
                        : ""}
                    </li>
                    <li>
                      {t("Point closes in about")}{" "}
                      <strong className="font-bold">{formatNumber(summary.sessions)}</strong>{" "}
                      {t("sessions")}
                    </li>
                  </ul>
                </CardBody>

                {row ? (
                  <div className="border-t border-edge px-4 py-3">
                    <Bar
                      label={"Experience (LV. " + formatNumber(row.value) + "/1000)"}
                      current={row.progress}
                      maximum={row.needed}
                      tone="experience"
                      delta={
                        row.value < MAX_ATTRIBUTE_VALUE ? (
                          <GainDelta total={totalExperience(row.value, row.progress)} />
                        ) : undefined
                      }
                      deltaTone="experience"
                      wraps
                    />
                  </div>
                ) : null}

                <div className="border-t border-edge px-4 py-3">
                  <Bar
                    label="Training"
                    current={session.id === exercise.id ? session.beat : 0}
                    maximum={session.id === exercise.id ? session.max : TRAINING_TICKS_MAX}
                    glows={active}
                    hideValue={session.id !== exercise.id || session.beat === 0}
                  />
                </div>

                <CardFooter>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-ink-faint">
                    {t(
                      active
                        ? opting
                          ? "Runs on its own..."
                          : state.automation.train
                            ? "Training non-stop..."
                            : "Training..."
                        : waitingExercise === exercise.id
                          ? "Waiting to continue"
                          : (reason ?? ""),
                    )}
                  </span>
                  <Button
                    variant={active ? "secondary" : ready ? "primary" : "outline"}
                    onClick={() => toggleTraining(exercise.id, ready)}
                    disabled={active ? !opting : !ready || locked}
                  >
                    {opting
                      ? "Stop (" + cooldown + ")"
                      : active
                        ? "Training..."
                        : waitLabel || "Train"}
                  </Button>
                </CardFooter>
              </Card>
              </div>
            );
          })}

          {petTraining ? (
            <div data-train-card={PET_EXERCISE_ID}>
            <Card
              height="fill"
              interactive={petActive || petReady}
              tone={petActive ? "highlighted" : "default"}
            >
              <CardHeader art={<PetArtFill gender={petTraining.pet.gender} />}>
                <RowText
                  title="Companion"
                  label="Companion training"
                  description={
                    <span className="font-mono text-[11px] text-ink">
                      {t("LV.")} {formatNumber(petTraining.level)}
                      <span className="text-ink-faint">
                        {" / " + formatNumber(PET_MAX_LEVEL)}
                      </span>
                      {petTraining.level >= PET_MAX_LEVEL ? (
                        <span className="ml-1 text-[10px] text-ink-faint">{t("cap")}</span>
                      ) : null}
                    </span>
                  }
                />
              </CardHeader>

              <CardBody>
                <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-ink-soft">
                  <li>
                    <strong className="font-bold">+1</strong> {t("Strength")},{" "}
                    <strong className="font-bold">+1</strong> {t("Agility")}{" "}
                    {t("and")} <strong className="font-bold">+1</strong> {t("Instinct")}{" "}
                    {t("per level")}
                  </li>
                  <li>
                    <strong className="font-bold">
                      +{formatFraction(petTraining.effort.progress / petTraining.needed)}
                    </strong>{" "}
                    {t("of a level per training")}
                  </li>
                  <li>
                    {t("Training for")}{" "}
                    <strong className="font-bold">{formatBronze(petTraining.cost)}</strong>
                  </li>
                </ul>
              </CardBody>

              <div className="border-t border-edge px-4 py-3">
                <Bar
                  label={"Companion - Experience (LV. " + formatNumber(petTraining.level) + "/1000)"}
                  current={petTraining.progress}
                  maximum={petTraining.needed}
                  tone="experience"
                  delta={
                    petTraining.maxed ? undefined : (
                      <GainDelta
                        total={petTotalTraining(petTraining.level, petTraining.progress)}
                      />
                    )
                  }
                  deltaTone="experience"
                  wraps
                />
              </div>

              <div className="border-t border-edge px-4 py-3">
                <Bar
                  label="Training"
                  current={session.id === PET_EXERCISE_ID ? session.beat : 0}
                  maximum={session.id === PET_EXERCISE_ID ? session.max : TRAINING_TICKS_MAX}
                  glows={petActive}
                  hideValue={session.id !== PET_EXERCISE_ID || session.beat === 0}
                />
              </div>

              <CardFooter>
                <span className="min-w-0 flex-1 truncate text-[11px] text-ink-faint">
                  {t(
                    petActive
                      ? cooldown !== null
                        ? "Runs on its own..."
                        : state.automation.train
                          ? "Training non-stop..."
                          : "Training..."
                      : (petTraining.reason ?? ""),
                  )}
                </span>
                <Button
                  variant={petActive ? "secondary" : petReady ? "primary" : "outline"}
                  onClick={() => toggleTraining(PET_EXERCISE_ID, petReady)}
                  disabled={petActive ? cooldown === null : !petReady || locked}
                >
                  {petActive && cooldown !== null
                    ? "Stop (" + cooldown + ")"
                    : petActive
                      ? "Training..."
                      : waitLabel || "Train"}
                </Button>
              </CardFooter>
            </Card>
            </div>
          ) : null}
        </div>
      </Panel>
    </>
  );
}
