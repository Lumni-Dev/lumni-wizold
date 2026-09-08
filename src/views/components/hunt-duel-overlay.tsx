"use client";

import type { Gender } from "@/models/entities/character";
import type { Creature } from "@/models/entities/creature";
import { cn } from "@/shared/utils/class-names";
import { CreatureIcon } from "./creature-icon";
import { GenderIcon } from "./gender-icon";
import { useShake } from "./use-shake";

export function HuntDuelOverlay({
  gender,
  foe,
  beat,
  blow,
  critical,
  fighting,
}: {
  gender: Gender;
  foe: Creature;
  beat: number;
  blow: "ours" | "pet" | "theirs" | null;
  critical: boolean;
  fighting: boolean;
}) {
  const oursStrike = fighting && (blow === "ours" || blow === "pet");
  const theirsStrike = fighting && blow === "theirs";
  const hunterHit = critical && theirsStrike ? beat : 0;
  const preyHit = critical && oursStrike ? beat : 0;
  const hunterShaking = useShake(hunterHit);
  const preyShaking = useShake(preyHit);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-t from-base/70 via-base/25 to-transparent"
    >
      <div className="flex items-center gap-3 px-3 sm:gap-4">
        <span className={cn("inline-flex", hunterShaking && "card-shake")}>
          <span
            key={oursStrike ? `ours-${beat}` : "ours-idle"}
            className={cn("inline-flex", oursStrike ? "duel-lunge-right" : "duel-idle")}
          >
            <GenderIcon gender={gender} size="large" className="art-soft-shadow" />
          </span>
        </span>
        <span className="select-none text-lg font-mono text-ink/80">×</span>
        <span className={cn("inline-flex", preyShaking && "card-shake")}>
          <span
            key={theirsStrike ? `theirs-${beat}` : "theirs-idle"}
            className={cn("inline-flex", theirsStrike ? "duel-lunge-left" : "duel-idle")}
          >
            <CreatureIcon creature={foe} size="large" tone="strong" className="art-soft-shadow" />
          </span>
        </span>
      </div>
    </div>
  );
}
