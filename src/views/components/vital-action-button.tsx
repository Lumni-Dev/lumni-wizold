"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { transformationRemainingMs } from "@/controllers/character.controller";
import { useGame } from "@/controllers/game.context";
import type { Character } from "@/models/entities/character";
import { REST_TICK_MS, TRANSFORM_DURATION_MS, TRANSFORM_RAGE_COST } from "@/shared/constants/game";
import { Button } from "./button";
import { RecoveryButton } from "./recovery-button";
import { Tooltip } from "./tooltip";

interface VitalAction {
  key: string;
  label: ReactNode;
  title: string;
  variant: "primary" | "secondary" | "outline";
  disabled: boolean;
  run: () => void;
}

function TransformCountdown({ character }: { character: Character }) {
  const [remaining, setRemaining] = useState(() => transformationRemainingMs(character));
  const characterRef = useRef(character);
  useEffect(() => {
    characterRef.current = character;
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(transformationRemainingMs(characterRef.current));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const seconds = Math.ceil(remaining / 1000);
  const pad = (value: number) => value.toString().padStart(2, "0");
  return <>{Math.floor(seconds / 60) + ":" + pad(seconds % 60)}</>;
}

export function VitalActionButton({ size = "medium" }: { size?: "small" | "medium" }) {
  const { character, stats, activity, setActivity, toggleForm, rest } = useGame();
  if (!character || !stats) return null;

  const isWerewolf = character.form === "werewolf";
  const resting = activity?.kind === "rest";
  const isWhole = character.health >= stats.maxHealth && character.rage >= stats.maxRage;
  const hasRage = character.rage >= TRANSFORM_RAGE_COST;
  const transformMinutes = TRANSFORM_DURATION_MS / 60_000;

  const actions: VitalAction[] = [];

  if (isWerewolf) {
    actions.push({
      key: "form",
      label: (
        <>
          Voltar a humano <TransformCountdown character={character} />
        </>
      ),
      title:
        "Recolhe a fera sem custo nenhum. Sozinha, a fúria dura " + transformMinutes + " minutos.",
      variant: "secondary",
      disabled: false,
      run: toggleForm,
    });
    if (!isWhole) {
      actions.push({
        key: "rest",
        label: "Recuperar-se",
        title:
          "Recolhe a fera e recupera um décimo do corpo a cada " +
          REST_TICK_MS / 1000 +
          " segundos: a besta não dorme.",
        variant: "outline",
        disabled: false,
        run: rest,
      });
    }
  } else if (resting) {
    return (
      <RecoveryButton
        recovering
        beat={character.health + "-" + character.rage}
        recoveringLabel="Recuperando-se..."
        label="Recuperar-se"
        tooltip={
          "O corpo se recompõe a cada " + REST_TICK_MS / 1000 + " segundos. Clique para interromper."
        }
        onClick={() => setActivity(null)}
      />
    );
  } else {
    actions.push({
      key: "form",
      label: "Transformar",
      title: hasRage
        ? "Custa " +
          TRANSFORM_RAGE_COST +
          " de fúria e aumenta força e resistência por " +
          transformMinutes +
          " minutos."
        : "Precisa de " + TRANSFORM_RAGE_COST + " de fúria. Cace para acumular.",
      variant: "primary",
      disabled: !hasRage,
      run: toggleForm,
    });
    if (!isWhole) {
      actions.push({
        key: "rest",
        label: "Recuperar-se",
        title:
          "Para todas as atividades e recupera um décimo do corpo a cada " +
          REST_TICK_MS / 1000 +
          " segundos.",
        variant: "outline",
        disabled: false,
        run: rest,
      });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => (
        <Tooltip key={action.key} label={action.title}>
          <Button
            size={size}
            variant={action.variant}
            onClick={action.run}
            disabled={action.disabled}
          >
            {action.label}
          </Button>
        </Tooltip>
      ))}
    </div>
  );
}
