"use client";

import { useEffect, useRef, useState } from "react";
import type { Gender } from "@/models/entities/character";
import { cn } from "@/shared/utils/class-names";
import { GenderIcon } from "./gender-icon";
import { useShake } from "./use-shake";

type SidePhase = "alive" | "dying" | "gone" | "enter";

const ENTER_MS = 550;
const DIE_MS = 500;
const CLAW_SLASH = "/assets/effects/claw-slash.gif?v=1";

export function ArenaDuelOverlay({
  gender,
  rivalGender,
  rivalId,
  beat,
  blow,
  critical,
  fighting,
  approaching,
  outcome,
  rivalHealth,
  finale,
}: {
  gender: Gender;
  rivalGender: Gender;
  rivalId: string;
  beat: number;
  blow: "ours" | "pet" | "theirs" | null;
  critical: boolean;
  fighting: boolean;
  approaching: boolean;
  outcome: "win" | "loss" | "draw" | null;
  rivalHealth: number | null;
  finale: boolean;
}) {
  const oursStrike = fighting && (blow === "ours" || blow === "pet");
  const theirsStrike = fighting && blow === "theirs";
  const hunterHit = critical && theirsStrike ? beat : 0;
  const rivalHit = critical && oursStrike ? beat : 0;
  const hunterShaking = useShake(hunterHit);
  const rivalShaking = useShake(rivalHit);
  const slashSide = oursStrike ? "ours" : theirsStrike ? "theirs" : null;

  const [hunterPhase, setHunterPhase] = useState<SidePhase>("alive");
  const [rivalPhase, setRivalPhase] = useState<SidePhase>("alive");
  const [shownRivalId, setShownRivalId] = useState(rivalId);
  const [shownRivalGender, setShownRivalGender] = useState(rivalGender);
  const rivalPhaseRef = useRef(rivalPhase);
  const hunterPhaseRef = useRef(hunterPhase);
  rivalPhaseRef.current = rivalPhase;
  hunterPhaseRef.current = hunterPhase;

  useEffect(() => {
    if (fighting && rivalHealth !== null && rivalHealth <= 0) {
      setRivalPhase((phase) => (phase === "alive" ? "dying" : phase));
    }
  }, [fighting, rivalHealth, beat]);

  useEffect(() => {
    if (!fighting || !finale || !outcome || outcome === "draw") return;
    if (outcome === "win") {
      setRivalPhase((phase) => (phase === "alive" ? "dying" : phase));
    }
    if (outcome === "loss") {
      setHunterPhase((phase) => (phase === "alive" ? "dying" : phase));
    }
  }, [fighting, finale, outcome, beat]);

  useEffect(() => {
    if (rivalPhase !== "dying") return;
    const timer = window.setTimeout(() => setRivalPhase("gone"), DIE_MS);
    return () => window.clearTimeout(timer);
  }, [rivalPhase]);

  useEffect(() => {
    if (hunterPhase !== "dying") return;
    const timer = window.setTimeout(() => setHunterPhase("gone"), DIE_MS);
    return () => window.clearTimeout(timer);
  }, [hunterPhase]);

  useEffect(() => {
    if (!approaching) return;
    if (rivalPhaseRef.current === "dying" || rivalPhaseRef.current === "gone") {
      setShownRivalId(rivalId);
      setShownRivalGender(rivalGender);
      setRivalPhase("enter");
    } else {
      setShownRivalId(rivalId);
      setShownRivalGender(rivalGender);
    }
    if (hunterPhaseRef.current === "dying" || hunterPhaseRef.current === "gone") {
      setHunterPhase("enter");
    }
  }, [approaching, rivalId, rivalGender]);

  useEffect(() => {
    if (rivalPhase !== "gone" && rivalPhase !== "dying") {
      setShownRivalId(rivalId);
      setShownRivalGender(rivalGender);
    }
  }, [rivalId, rivalGender, rivalPhase]);

  useEffect(() => {
    if (rivalPhase !== "enter") return;
    const timer = window.setTimeout(() => setRivalPhase("alive"), ENTER_MS);
    return () => window.clearTimeout(timer);
  }, [rivalPhase]);

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

  const rivalMotion =
    rivalPhase === "dying"
      ? "duel-fade-out"
      : rivalPhase === "enter"
        ? "duel-enter-right"
        : rivalPhase === "gone"
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
            <GenderIcon gender={gender} size="large" tone="glass" />
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
        <span className={cn("relative inline-flex", rivalShaking && rivalPhase === "alive" && "card-shake")}>
          <span
            key={
              rivalPhase === "enter"
                ? `rival-enter-${shownRivalId}-${beat}`
                : theirsStrike
                  ? `theirs-${beat}`
                  : `rival-${rivalPhase}-${shownRivalId}`
            }
            className={cn("inline-flex", rivalMotion)}
          >
            <GenderIcon gender={shownRivalGender} size="large" tone="glass" />
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
