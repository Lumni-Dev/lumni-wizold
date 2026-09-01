"use client";

import { useMemo, useSyncExternalStore } from "react";
import { activityRuntimeStore } from "@/controllers/activity-runtime";
import { useGame } from "@/controllers/game.context";
import { petTrainingView } from "@/controllers/pet.controller";
import { listAttributeProgress, listExercises } from "@/controllers/training.controller";
import { usePageActivity } from "@/controllers/use-page-activity";
import { MAX_ATTRIBUTE_VALUE, PET_EXERCISE_ID, PET_MAX_LEVEL, TRAINING_TICKS } from "@/shared/constants/game";
import { formatNumber, formatBronze } from "@/shared/utils/format";
import { Bar } from "../components/bar";
import { BodyGate } from "../components/body-gate";
import { Button } from "../components/button";
import { Tag } from "../components/tag";
import { PetIcon } from "../components/pet-icon";
import { TrainingIcon } from "../components/training-icon";
import { Card, CardBody, CardFooter, CardHeader } from "../components/card";
import { RowText } from "../components/list";
import { Panel } from "../components/panel";
import { PageHeader } from "../layout/page-header";

export function TrainingScreen() {
  const { state, character, stats, activity, setActivity } = useGame();
  usePageActivity(["train"]);
  const runtime = useSyncExternalStore(
    activityRuntimeStore.subscribe,
    activityRuntimeStore.snapshot,
    activityRuntimeStore.serverSnapshot,
  );
  const trainRt = runtime.train;
  const paused = activity?.paused === true;
  const activeExercise = activity?.kind === "train" && !paused ? (activity.id ?? null) : null;
  const waitingExercise = activity?.kind === "train" && paused ? (activity.id ?? null) : null;
  const session =
    trainRt && activeExercise === trainRt.id
      ? { id: trainRt.id, beat: trainRt.beat }
      : { id: activeExercise ?? "", beat: 0 };
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
        description="Um exercício por atributo, cada barra cheia vira um ponto permanente. Não dá para parar no meio de uma sessão, mas entre uma e outra sobram três segundos para você mandar parar."
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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {exercises.map(({ exercise, effort, cost, affordable, maxed, reason }) => {
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
                <CardHeader>
                  <TrainingIcon attribute={exercise.attribute} size="medium" />
                  <RowText
                    title={row?.name ?? exercise.name}
                    label={exercise.name}
                  />
                  <span className="shrink-0 self-center font-mono text-sm text-ink">
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
                  <p className="text-xs leading-relaxed text-ink-soft">{row?.effect}</p>
                  <p className="text-xs leading-relaxed text-ink-faint">{exercise.description}</p>

                  <div className="flex flex-wrap gap-2">
                    <Tag>+{effort.progress} de progresso por treinamento</Tag>
                    <Tag>Treino por {formatBronze(cost)}</Tag>
                  </div>
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
                    maximum={TRAINING_TICKS}
                    glows={active}
                    wraps
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
                        ? "Esperando WCoins para continuar"
                        : reason}
                  </span>
                  <BodyGate open={ready && !active} reason="Vida baixa demais para treinar.">
                    <Button
                      variant={active ? "secondary" : ready ? "primary" : "outline"}
                      onClick={() => toggleTraining(exercise.id, ready)}
                      disabled={active ? !opting : !ready}
                    >
                      {opting ? "Parar (" + cooldown + ")" : active ? "Treinando..." : "Treinar"}
                    </Button>
                  </BodyGate>
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
              <CardHeader>
                <PetIcon gender={petTraining.pet.gender} size="medium" />
                <RowText title="Mascote" label="Treino do mascote" />
                <span className="shrink-0 self-center font-mono text-sm text-ink">
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
                  maximum={TRAINING_TICKS}
                  glows={petActive}
                  wraps
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
                <BodyGate open={petReady && !petActive} reason="Vida baixa demais para treinar.">
                  <Button
                    variant={petActive ? "secondary" : petReady ? "primary" : "outline"}
                    onClick={() => toggleTraining(PET_EXERCISE_ID, petReady)}
                    disabled={petActive ? cooldown === null : !petReady}
                  >
                    {petActive && cooldown !== null
                      ? "Parar (" + cooldown + ")"
                      : petActive
                        ? "Treinando..."
                        : "Treinar"}
                  </Button>
                </BodyGate>
              </CardFooter>
            </Card>
          ) : null}
        </div>
      </Panel>
    </>
  );
}
