"use client";

import { useGame } from "@/controllers/game.context";
import { useVisibleActivity } from "@/controllers/use-visible-activity";
import { BAU_LIMIT } from "@/shared/constants/game";
import { formatNumber, formatVault } from "@/shared/utils/format";
import { Bar } from "../components/bar";
import { RestSeconds } from "../components/rest-seconds";
import { RestHealed } from "../components/rest-healed";

export function ResourceBar() {
  const { character, stats } = useGame();
  const { activity } = useVisibleActivity();
  if (!character || !stats) return null;

  const resting = activity?.kind === "rest";

  return (
    <header className="border-b border-edge bg-surface/40 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 md:px-8 md:py-4 lg:h-[74px] lg:flex-row lg:items-center">
        <div className="grid grid-cols-1 flex-1 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          <Bar
            label={
              resting ? (
                <>
                  Vida (Recuperando-se... <RestSeconds />)
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
            delta={resting ? <RestHealed /> : undefined}
          />
          <Bar
            label="Baú"
            current={character.bronze}
            maximum={BAU_LIMIT}
            tone="ember"
            prominent
            unit="WCoins"
            format={formatVault}
          />
          <Bar
            label={"Experiência (NV. " + formatNumber(character.level) + "/1000)"}
            current={character.experience}
            maximum={stats.experienceNeeded}
            tone="experience"
            wraps
            prominent
          />
        </div>
      </div>
    </header>
  );
}
