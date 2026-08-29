"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/controllers/game.context";
import { isGameSound, playSound } from "@/controllers/sound";
import { petTrainingView } from "@/controllers/pet.controller";
import { listAttributeProgress, listExercises } from "@/controllers/training.controller";
import {
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
  const { state, character, stats, train, activity, setActivity } = useGame();
  const paused = activity?.paused === true;
  const activeExercise = activity?.kind === "train" && !paused ? (activity.id ?? null) : null;
  const waitingExercise = activity?.kind === "train" && paused ? (activity.id ?? null) : null;

  const exercises = useMemo(() => listExercises(state), [state]);
  const progress = useMemo(() => listAttributeProgress(state), [state]);
  const petTraining = useMemo(() => petTrainingView(state), [state]);
  const petActive = activeExercise === PET_EXERCISE_ID;
  const petReady = petTraining !== null && !petTraining.maxed && petTraining.affordable;

  const [session, setSession] = useState<{ id: string; beat: number }>({ id: "", beat: 0 });
  const beatRef = useRef(0);

  const autoRef = useRef(state.automation.train);
  const trainRef = useRef(train);
  const chargesRef = useRef(false);
  const paidLapRef = useRef(false);
  const deadLapRef = useRef(false);
  useEffect(() => {
    autoRef.current = state.automation.train;
    trainRef.current = train;
    let fresh = false;
    if (!activeExercise) {
      paidLapRef.current = false;
      deadLapRef.current = false;
    } else if (activeExercise === PET_EXERCISE_ID) {
      fresh = petTraining !== null && !petTraining.maxed && petTraining.progress === 0;
    } else {
      const entry = exercises.find((candidate) => candidate.exercise.id === activeExercise);
      const row = progress.find((line) => line.key === entry?.exercise.attribute);
      fresh = row !== undefined && row.progress === 0 && row.value < MAX_ATTRIBUTE_VALUE;
    }
    if (!fresh) paidLapRef.current = false;
    chargesRef.current = fresh && !paidLapRef.current;
  });

  const petGone = petTraining === null;
  useEffect(() => {
    if (activeExercise === PET_EXERCISE_ID && petGone) setActivity(null);
  }, [activeExercise, petGone, setActivity]);

  useEffect(() => {
    if (!activeExercise) return;
    if (activeExercise === PET_EXERCISE_ID && petGone) return;

    const timer = window.setInterval(() => {
      if (deadLapRef.current) {
        beatRef.current += 1;
        if (beatRef.current >= TRAINING_TICKS) {
          deadLapRef.current = false;
          beatRef.current = 0;
        }
        return;
      }

      beatRef.current = beatRef.current >= TRAINING_TICKS ? 0 : beatRef.current + 1;

      if (beatRef.current === 1 && chargesRef.current) {
        chargesRef.current = false;
        paidLapRef.current = true;
        deadLapRef.current = true;
        playSound("buy");
        beatRef.current = 0;
        setSession({ id: activeExercise, beat: 0 });
        return;
      }

      setSession({ id: activeExercise, beat: beatRef.current });
      if (beatRef.current > 0) {
        const effort = activeExercise === PET_EXERCISE_ID ? "growl" : activeExercise;
        if (isGameSound(effort)) playSound(effort);
      }

      if (beatRef.current < TRAINING_TICKS) return;
      if (!trainRef.current(activeExercise)) {
        setActivity(autoRef.current ? { kind: "train", id: activeExercise, paused: true } : null);
        return;
      }
      if (!autoRef.current) {
        beatRef.current = 0;
        setSession({ id: activeExercise, beat: 0 });
        setActivity(null);
      }
    }, TRAINING_TICK_MS);

    return () => window.clearInterval(timer);
  }, [activeExercise, petGone, setActivity]);

  if (!character || !stats) return null;

  const transformed = character.form === "werewolf";

  function toggleTraining(exerciseId: string, ready: boolean) {
    beatRef.current = 0;
    paidLapRef.current = false;
    deadLapRef.current = false;
    setSession({ id: exerciseId, beat: 0 });

    if (activeExercise === exerciseId) {
      setActivity(null);
      return;
    }
    if (!ready) return;

    let fresh = false;
    if (exerciseId === PET_EXERCISE_ID) {
      fresh = petTraining !== null && !petTraining.maxed && petTraining.progress === 0;
    } else {
      const entry = exercises.find((candidate) => candidate.exercise.id === exerciseId);
      const row = progress.find((line) => line.key === entry?.exercise.attribute);
      fresh = row !== undefined && row.progress === 0 && row.value < MAX_ATTRIBUTE_VALUE;
    }
    if (fresh) {
      paidLapRef.current = true;
      deadLapRef.current = true;
      playSound("buy");
    }

    setActivity({ kind: "train", id: exerciseId });
  }

  return (
    <>
      <PageHeader
        title="Treinamento"
        description="Só a fera treina: um exercício por atributo, cada barra cheia vira um ponto permanente, e o custo do próximo cresce a cada avanço."
        action={<Tag tone="neutral">{formatBronze(character.bronze)}</Tag>}
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
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {exercises.map(({ exercise, effort, cost, affordable, maxed, reason }) => {
            const row = progress.find((entry) => entry.key === exercise.attribute);
            const ready = !maxed && affordable;
            const active = activeExercise === exercise.id;

            return (
              <Card
                key={exercise.id}
                height="fill"
                interactive={ready}
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
                    {maxed ? <span className="ml-1 text-[10px] text-ink-faint">teto</span> : null}
                  </span>
                </CardHeader>

                <CardBody>
                  <p className="text-xs leading-relaxed text-ink-soft">{row?.effect}</p>
                  <p className="text-xs leading-relaxed text-ink-faint">{exercise.description}</p>

                  <div className="flex flex-wrap gap-2">
                    <Tag>+{effort.progress} de progresso por treinamento</Tag>
                    <Tag>Ponto por {formatBronze(cost)}, pago adiantado</Tag>
                  </div>

                  {row ? (
                    <Bar
                      label="Progresso"
                      current={row.progress}
                      maximum={row.needed}
                      wraps
                      className="mt-auto"
                    />
                  ) : null}

                  <Bar
                    label="Treinamento"
                    current={session.id === exercise.id ? session.beat : 0}
                    maximum={TRAINING_TICKS}
                    wraps
                  />
                </CardBody>

                <CardFooter>
                  <span className="text-[11px] text-ink-faint">
                    {active
                      ? state.automation.train
                        ? "Treinando sem parar..."
                        : "Treinando..."
                      : waitingExercise === exercise.id
                        ? "Esperando bronze para continuar"
                        : reason}
                  </span>
                  <BodyGate open={ready && !active} reason="Só a fera treina.">
                    <Button
                      variant={active ? "secondary" : ready ? "primary" : "outline"}
                      onClick={() => toggleTraining(exercise.id, ready && transformed)}
                      disabled={!ready && !active}
                    >
                      {active ? "Parar" : "Treinar"}
                    </Button>
                  </BodyGate>
                </CardFooter>
              </Card>
            );
          })}

          {petTraining ? (
            <Card height="fill" interactive={petReady} tone={petActive ? "highlighted" : "default"}>
              <CardHeader>
                <PetIcon gender={petTraining.pet.gender} size="medium" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm text-ink">{petTraining.pet.name}</h3>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    Treino do mascote
                  </p>
                </div>
                <span className="shrink-0 font-mono text-sm text-ink">
                  NV. {formatNumber(petTraining.level)}
                  <span className="text-ink-faint">{" / " + formatNumber(PET_MAX_LEVEL)}</span>
                  {petTraining.maxed ? (
                    <span className="ml-1 text-[10px] text-ink-faint">teto</span>
                  ) : null}
                </span>
              </CardHeader>

              <CardBody>
                <p className="text-xs leading-relaxed text-ink-soft">
                  Cada nível soma 1 de Força, 1 de Agilidade e 1 de Instinto ao que{" "}
                  {petTraining.pet.name} empresta enquanto caça com você.
                </p>

                <div className="flex flex-wrap gap-2">
                  <Tag>+{petTraining.effort.progress} de progresso por treinamento</Tag>
                  <Tag>Nível por {formatBronze(petTraining.cost)}, pago adiantado</Tag>
                </div>

                <Bar
                  label="Progresso"
                  current={petTraining.progress}
                  maximum={petTraining.needed}
                  wraps
                  className="mt-auto"
                />

                <Bar
                  label="Treinamento"
                  current={session.id === PET_EXERCISE_ID ? session.beat : 0}
                  maximum={TRAINING_TICKS}
                  wraps
                />
              </CardBody>

              <CardFooter>
                <span className="text-[11px] text-ink-faint">
                  {petActive
                    ? state.automation.train
                      ? "Treinando sem parar..."
                      : "Treinando..."
                    : petTraining.reason}
                </span>
                <BodyGate open={petReady && !petActive} reason="Só a fera treina.">
                  <Button
                    variant={petActive ? "secondary" : petReady ? "primary" : "outline"}
                    onClick={() => toggleTraining(PET_EXERCISE_ID, petReady && transformed)}
                    disabled={!petReady && !petActive}
                  >
                    {petActive ? "Parar" : "Treinar"}
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
