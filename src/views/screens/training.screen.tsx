"use client";

import { useMemo } from "react";
import { useGame } from "@/controllers/game.context";
import { petTrainingView } from "@/controllers/pet.controller";
import {
  listAttributeProgress,
  listExercises,
  trainingSummaryLine,
} from "@/controllers/training.controller";
import { ACTIVITY_WAIT_LABEL, useActivityLock } from "@/controllers/use-activity-lock";
import { useVisibleActivity } from "@/controllers/use-visible-activity";
import {
  MAX_ATTRIBUTE_VALUE,
  PET_EXERCISE_ID,
  PET_MAX_LEVEL,
  TRAINING_TICKS_MAX,
  TRAINING_TICKS_MIN,
} from "@/shared/constants/game";
import { formatNumber, formatBronze } from "@/shared/utils/format";
import { Bar } from "../components/bar";
import { Button } from "../components/button";
import { Tag } from "../components/tag";
import { PetArtFill } from "../components/pet-icon";
import { TrainingArtFill } from "../components/training-icon";
import { Card, CardBody, CardFooter, CardHeader } from "../components/card";
import { RowText } from "../components/list";
import { Panel } from "../components/panel";
import { PageHeader } from "../layout/page-header";

export function TrainingScreen() {
  const { state, character, stats, setActivity } = useGame();
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
        title="Treinamento"
        description={
          "Treino gratuito para sempre: um exercício por atributo, cada barra cheia vira +1 permanente. Cada sessão sorteia de " +
          TRAINING_TICKS_MIN +
          " a " +
          TRAINING_TICKS_MAX +
          " passos, então uma sai rápida e a seguinte cobra paciência. Não dá para parar no meio de uma sessão, mas entre uma e outra sobram três segundos para você mandar parar."
        }
      />

      <Panel
        title="Atributos"
        description={
          (state.automation.train
            ? "O treino repete sozinho até você mandar parar, e o teto de cada atributo é "
            : "Cada clique treina uma sessão, e o teto de cada atributo é ") +
          formatNumber(MAX_ATTRIBUTE_VALUE) +
          "."
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {exercises.map(({ exercise, effort, affordable, maxed, reason }) => {
            const row = progress.find((entry) => entry.key === exercise.attribute);
            const ready = !maxed && affordable;
            const active = activeExercise === exercise.id;
            const opting = active && cooldown !== null;

            return (
              <Card
                key={exercise.id}
                height="fill"
                interactive={active || ready}
                tone={active ? "highlighted" : "default"}
              >
                <CardHeader
                  art={<TrainingArtFill attribute={exercise.attribute} />}
                  className="flex-wrap"
                >
                  <div className="flex min-w-[7rem] flex-1">
                    <RowText
                      title={row?.name ?? exercise.name}
                      label={exercise.name}
                    />
                  </div>
                  <span className="ml-auto shrink-0 self-center font-mono text-sm text-ink">
                    NV. {formatNumber(row?.value ?? 0)}
                    <span className="text-ink-faint">
                      {" / " + formatNumber(MAX_ATTRIBUTE_VALUE)}
                    </span>
                    {(row?.value ?? 0) >= MAX_ATTRIBUTE_VALUE ? (
                      <span className="ml-1 text-[10px] text-ink-faint">teto</span>
                    ) : null}
                  </span>
                </CardHeader>

                <CardBody>
                  <p className="text-xs leading-relaxed text-ink-soft">
                    {trainingSummaryLine(row?.name ?? exercise.name, row?.value ?? 0, effort)}
                  </p>
                  <p className="text-xs leading-relaxed text-ink-faint">{exercise.description}</p>
                </CardBody>

                {row ? (
                  <div className="border-t border-edge px-4 py-3">
                    <Bar label="Progresso" current={row.progress} maximum={row.needed} wraps />
                  </div>
                ) : null}

                <div className="border-t border-edge px-4 py-3">
                  <Bar
                    label="Treinamento"
                    current={session.id === exercise.id ? session.beat : 0}
                    maximum={session.id === exercise.id ? session.max : TRAINING_TICKS_MAX}
                    glows={active}
                  />
                </div>

                <CardFooter>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-ink-faint">
                    {active
                      ? opting
                        ? "Segue sozinho..."
                        : state.automation.train
                          ? "Treinando sem parar..."
                          : "Treinando..."
                      : waitingExercise === exercise.id
                        ? "Esperando para continuar"
                        : reason}
                  </span>
                  <Button
                    variant={active ? "secondary" : ready ? "primary" : "outline"}
                    onClick={() => toggleTraining(exercise.id, ready)}
                    disabled={active ? !opting : !ready || locked}
                  >
                    {opting
                      ? "Parar (" + cooldown + ")"
                      : active
                        ? "Treinando..."
                        : waitLabel || "Treinar"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}

          {petTraining ? (
            <Card
              height="fill"
              interactive={petActive || petReady}
              tone={petActive ? "highlighted" : "default"}
            >
              <CardHeader
                art={<PetArtFill gender={petTraining.pet.gender} />}
                className="flex-wrap"
              >
                <div className="flex min-w-[7rem] flex-1">
                  <RowText title="Mascote" label="Treino do mascote" />
                </div>
                <span className="ml-auto shrink-0 self-center font-mono text-sm text-ink">
                  NV. {formatNumber(petTraining.level)}
                  <span className="text-ink-faint">{" / " + formatNumber(PET_MAX_LEVEL)}</span>
                  {petTraining.level >= PET_MAX_LEVEL ? (
                    <span className="ml-1 text-[10px] text-ink-faint">teto</span>
                  ) : null}
                </span>
              </CardHeader>

              <CardBody>
                <p className="text-xs leading-relaxed text-ink-soft">
                  Cada nível soma 1 de Força, 1 de Agilidade e 1 de Instinto ao que o mascote
                  empresta enquanto caça com você.
                </p>

                <div className="flex flex-wrap gap-2">
                  <Tag>+{petTraining.effort.progress} de progresso por treinamento</Tag>
                  <Tag>Treino por {formatBronze(petTraining.cost)}</Tag>
                </div>
              </CardBody>

              <div className="border-t border-edge px-4 py-3">
                <Bar
                  label="Progresso"
                  current={petTraining.progress}
                  maximum={petTraining.needed}
                  wraps
                />
              </div>

              <div className="border-t border-edge px-4 py-3">
                <Bar
                  label="Treinamento"
                  current={session.id === PET_EXERCISE_ID ? session.beat : 0}
                  maximum={session.id === PET_EXERCISE_ID ? session.max : TRAINING_TICKS_MAX}
                  glows={petActive}
                />
              </div>

              <CardFooter>
                <span className="min-w-0 flex-1 truncate text-[11px] text-ink-faint">
                  {petActive
                    ? cooldown !== null
                      ? "Segue sozinho..."
                      : state.automation.train
                        ? "Treinando sem parar..."
                        : "Treinando..."
                    : petTraining.reason}
                </span>
                <Button
                  variant={petActive ? "secondary" : petReady ? "primary" : "outline"}
                  onClick={() => toggleTraining(PET_EXERCISE_ID, petReady)}
                  disabled={petActive ? cooldown === null : !petReady || locked}
                >
                  {petActive && cooldown !== null
                    ? "Parar (" + cooldown + ")"
                    : petActive
                      ? "Treinando..."
                      : waitLabel || "Treinar"}
                </Button>
              </CardFooter>
            </Card>
          ) : null}
        </div>
      </Panel>
    </>
  );
}
