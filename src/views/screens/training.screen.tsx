"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { isGameSound, playSound } from "@/controllers/sound";
import { petTrainingView } from "@/controllers/pet.controller";
import { listAttributeProgress, listExercises } from "@/controllers/training.controller";
import { usePageActivity } from "@/controllers/use-page-activity";
import {
  CYCLE_OPTOUT_SECS,
  MAX_ATTRIBUTE_VALUE,
  PET_EXERCISE_ID,
  PET_MAX_LEVEL,
  TRAINING_TICK_MS,
  TRAINING_TICKS,
} from "@/shared/constants/game";
import { formatNumber, formatBronze } from "@/shared/utils/format";
import { Bar } from "../components/bar";
import { BodyGate } from "../components/body-gate";
import { Button } from "../components/button";
import { Tag } from "../components/tag";
import { PetIcon } from "../components/pet-icon";
import { TrainingIcon } from "../components/training-icon";
import { Card, CardBody, CardFooter, CardHeader } from "../components/card";
import { Panel } from "../components/panel";
import { PageHeader } from "../layout/page-header";

export function TrainingScreen() {
  const { state, character, stats, train, notify, activity, setActivity } = useGame();
  usePageActivity(["train"]);
  const paused = activity?.paused === true;
  const activeExercise = activity?.kind === "train" && !paused ? (activity.id ?? null) : null;
  const waitingExercise = activity?.kind === "train" && paused ? (activity.id ?? null) : null;

  const exercises = useMemo(() => listExercises(state), [state]);
  const progress = useMemo(() => listAttributeProgress(state), [state]);
  const petTraining = useMemo(() => petTrainingView(state), [state]);
  const petActive = activeExercise === PET_EXERCISE_ID;
  const petReady = petTraining !== null && !petTraining.maxed && petTraining.affordable;

  const [session, setSession] = useState<{ id: string; beat: number }>({ id: "", beat: 0 });
  const [cooldown, setCooldown] = useState<number | null>(null);
  const beatRef = useRef(0);

  const autoRef = useRef(state.automation.train);
  const trainRef = useRef(train);
  const notifyRef = useRef(notify);
  const resumableRef = useRef(false);
  useEffect(() => {
    autoRef.current = state.automation.train;
    trainRef.current = train;
    notifyRef.current = notify;
    if (activeExercise === PET_EXERCISE_ID) {
      if (petTraining) resumableRef.current = !petTraining.maxed;
    } else if (activeExercise) {
      const entry = exercises.find((candidate) => candidate.exercise.id === activeExercise);
      if (entry) resumableRef.current = !entry.maxed;
    }
  });

  const petGone = petTraining === null;
  useEffect(() => {
    if (activeExercise === PET_EXERCISE_ID && petGone) setActivity(null);
  }, [activeExercise, petGone, setActivity]);

  useEffect(() => {
    if (!activeExercise) return;
    if (activeExercise === PET_EXERCISE_ID && petGone) return;
    let alive = true;
    let barTimer = 0;
    let coolTimer = 0;
    beatRef.current = 0;
    /* eslint-disable react-hooks/set-state-in-effect */
    setSession({ id: activeExercise, beat: 0 });
    setCooldown(null);
    /* eslint-enable react-hooks/set-state-in-effect */

    const startBar = () => {
      beatRef.current = 0;
      setSession({ id: activeExercise, beat: 0 });
      barTimer = window.setInterval(() => {
        beatRef.current += 1;
        setSession({ id: activeExercise, beat: beatRef.current });
        if (beatRef.current < TRAINING_TICKS) {
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
          beatRef.current = 0;
          setSession({ id: activeExercise, beat: 0 });
          if (!landed) {
            setActivity(
              autoRef.current && resumableRef.current
                ? { kind: "train", id: activeExercise, paused: true }
                : null,
            );
            return;
          }
          if (!autoRef.current) {
            setActivity(null);
            return;
          }
          startCooldown();
        });
      }, TRAINING_TICK_MS);
    };

    const startCooldown = () => {
      let left = CYCLE_OPTOUT_SECS;
      setCooldown(left);
      coolTimer = window.setInterval(() => {
        left -= 1;
        if (left <= 0) {
          window.clearInterval(coolTimer);
          coolTimer = 0;
          setCooldown(null);
          startBar();
        } else {
          setCooldown(left);
        }
      }, 1000);
    };

    startBar();

    return () => {
      alive = false;
      if (barTimer) window.clearInterval(barTimer);
      if (coolTimer) window.clearInterval(coolTimer);
    };
  }, [activeExercise, petGone, setActivity]);

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
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm text-ink">{row?.name ?? exercise.name}</h3>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      {exercise.name}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-sm text-ink">
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
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm text-ink">Mascote</h3>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    Treino do mascote
                  </p>
                </div>
                <span className="shrink-0 font-mono text-sm text-ink">
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
