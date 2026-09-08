"use client";

import { useEffect, useRef, useState } from "react";
import type { Gender } from "@/models/entities/character";
import type { Creature } from "@/models/entities/creature";
import { cn } from "@/shared/utils/class-names";
import { CreatureIcon } from "./creature-icon";
import { GenderIcon } from "./gender-icon";
import { useShake } from "./use-shake";

type SidePhase = "alive" | "dying" | "gone" | "enter";

const ENTER_MS = 550;
const DIE_MS = 500;
const CLAW_SLASH = "/assets/effects/claw-slash.gif?v=1";

export function HuntDuelOverlay({
  gender,
  foe,
  beat,
  blow,
  critical,
  fighting,
  approaching,
  outcome,
  creatureHealth,
  finale,
}: {
  gender: Gender;
  foe: Pick<Creature, "id" | "name">;
  beat: number;
  blow: "ours" | "pet" | "theirs" | null;
  critical: boolean;
  fighting: boolean;
  approaching: boolean;
  outcome: "win" | "loss" | "draw" | null;
  creatureHealth: number | null;
  finale: boolean;
}) {
  const oursStrike = fighting && (blow === "ours" || blow === "pet");
  const theirsStrike = fighting && blow === "theirs";
  const hunterHit = critical && theirsStrike ? beat : 0;
  const preyHit = critical && oursStrike ? beat : 0;
  const hunterShaking = useShake(hunterHit);
  const preyShaking = useShake(preyHit);
  const slashSide = oursStrike ? "ours" : theirsStrike ? "theirs" : null;

  const [hunterPhase, setHunterPhase] = useState<SidePhase>("alive");
  const [preyPhase, setPreyPhase] = useState<SidePhase>("alive");
  const [shownFoe, setShownFoe] = useState(foe);
  const preyPhaseRef = useRef(preyPhase);
  const hunterPhaseRef = useRef(hunterPhase);
  preyPhaseRef.current = preyPhase;
  hunterPhaseRef.current = hunterPhase;

  useEffect(() => {
    if (fighting && creatureHealth !== null && creatureHealth <= 0) {
      setPreyPhase((phase) => (phase === "alive" ? "dying" : phase));
    }
  }, [fighting, creatureHealth, beat]);

  useEffect(() => {
    if (!fighting || !finale || !outcome || outcome === "draw") return;
    if (outcome === "win") {
      setPreyPhase((phase) => (phase === "alive" ? "dying" : phase));
    }
    if (outcome === "loss") {
      setHunterPhase((phase) => (phase === "alive" ? "dying" : phase));
    }
  }, [fighting, finale, outcome, beat]);

  useEffect(() => {
    if (preyPhase !== "dying") return;
    const timer = window.setTimeout(() => setPreyPhase("gone"), DIE_MS);
    return () => window.clearTimeout(timer);
  }, [preyPhase]);

  useEffect(() => {
    if (hunterPhase !== "dying") return;
    const timer = window.setTimeout(() => setHunterPhase("gone"), DIE_MS);
    return () => window.clearTimeout(timer);
  }, [hunterPhase]);

  useEffect(() => {
    if (!approaching) return;
    if (preyPhaseRef.current === "dying" || preyPhaseRef.current === "gone") {
      setShownFoe(foe);
      setPreyPhase("enter");
    } else {
      setShownFoe(foe);
    }
    if (hunterPhaseRef.current === "dying" || hunterPhaseRef.current === "gone") {
      setHunterPhase("enter");
    }
  }, [approaching, foe]);

  useEffect(() => {
    if (preyPhase !== "gone" && preyPhase !== "dying") {
      setShownFoe(foe);
    }
  }, [foe, preyPhase]);

  useEffect(() => {
    if (preyPhase !== "enter") return;
    const timer = window.setTimeout(() => setPreyPhase("alive"), ENTER_MS);
    return () => window.clearTimeout(timer);
  }, [preyPhase]);

  useEffect(() => {
    if (hunterPhase !== "enter") return;
    const timer = window.setTimeout(() => setHunterPhase("alive"), ENTER_MS);
    return () => window.clearTimeout(timer);
  }, [hunterPhase]);

  const hunterMotion =
    hunterPhase === "dying"
      ? "duel-fade-out"
      : hunterPhase === "enter"
        ? "duel-enter-left"
        : hunterPhase === "gone"
          ? "opacity-0"
          : oursStrike
            ? "duel-lunge-right"
            : "duel-idle";

  const preyMotion =
    preyPhase === "dying"
      ? "duel-fade-out"
      : preyPhase === "enter"
        ? "duel-enter-right"
        : preyPhase === "gone"
          ? "opacity-0"
          : theirsStrike
            ? "duel-lunge-left"
            : "duel-idle";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-t from-base/70 via-base/25 to-transparent"
    >
      <div className="relative flex items-center gap-3 px-3 sm:gap-4">
        <span className={cn("relative inline-flex", hunterShaking && hunterPhase === "alive" && "card-shake")}>
          <span
            key={
              hunterPhase === "enter"
                ? `hunter-enter-${beat}`
                : oursStrike
                  ? `ours-${beat}`
                  : `hunter-${hunterPhase}`
            }
            className={cn("inline-flex", hunterMotion)}
          >
            <GenderIcon gender={gender} size="large" className="art-soft-shadow" />
          </span>
          {slashSide === "theirs" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`slash-theirs-${beat}`}
              src={CLAW_SLASH}
              alt=""
              className="absolute left-1/2 top-1/2 z-20 h-14 w-20 -translate-x-1/2 -translate-y-1/2 -rotate-90 object-contain mix-blend-screen -scale-x-100 -scale-y-100 sm:h-16 sm:w-24"
            />
          ) : null}
        </span>
        <span className={cn("relative inline-flex", preyShaking && preyPhase === "alive" && "card-shake")}>
          <span
            key={
              preyPhase === "enter"
                ? `prey-enter-${shownFoe.id}-${beat}`
                : theirsStrike
                  ? `theirs-${beat}`
                  : `prey-${preyPhase}-${shownFoe.id}`
            }
            className={cn("inline-flex", preyMotion)}
          >
            <CreatureIcon creature={shownFoe} size="large" tone="strong" className="art-soft-shadow" />
          </span>
          {slashSide === "ours" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`slash-ours-${beat}`}
              src={CLAW_SLASH}
              alt=""
              className="absolute left-1/2 top-1/2 z-20 h-14 w-20 -translate-x-1/2 -translate-y-1/2 rotate-90 object-contain mix-blend-screen -scale-y-100 sm:h-16 sm:w-24"
            />
          ) : null}
        </span>
      </div>
    </div>
  );
}
