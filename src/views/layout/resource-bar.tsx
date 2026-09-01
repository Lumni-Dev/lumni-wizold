"use client";

import { useGame } from "@/controllers/game.context";
import { BAU_LIMIT } from "@/shared/constants/game";
import { formatNumber } from "@/shared/utils/format";
import { Bar } from "../components/bar";
import { RestSeconds } from "../components/rest-seconds";

export function ResourceBar() {
  const { character, stats, activity } = useGame();
  if (!character || !stats) return null;

  const resting = activity?.kind === "rest";

  return (
    <header className="border-b border-edge bg-surface/40 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 p-4 md:px-8 lg:h-[74px] lg:flex-row lg:items-center">
        <div className="grid flex-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Bar
            label={
              resting ? (
                <>
                  Vida (Recuperando-se... <RestSeconds key={character.health} />)
                </>
              ) : (
                "Vida"
              )
            }
            current={character.health}
            maximum={stats.maxHealth}
            glows={resting && character.health < stats.maxHealth}
            tone="blood"
            prominent
          />
          <Bar label="Baú" current={character.bronze} maximum={BAU_LIMIT} tone="ember" prominent />
          <Bar
            label={"Experiência (NV. " + formatNumber(character.level) + ")"}
            current={character.experience}
            maximum={stats.experienceNeeded}
            tone="fury"
            wraps
            prominent
          />
        </div>
      </div>
    </header>
  );
}
