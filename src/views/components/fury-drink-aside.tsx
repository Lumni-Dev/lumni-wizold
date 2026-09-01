"use client";

import { Flame } from "lucide-react";
import { useMemo } from "react";
import { useGame } from "@/controllers/game.context";
import { detailInventory } from "@/controllers/inventory.controller";
import { playClick } from "@/controllers/sound";
import { furyRemainingMs } from "@/models/rules/moon";
import { FuryRingFrame } from "./fury-ring-frame";

export function FuryDrinkAside() {
  const { character, moon, state, consumeItem } = useGame();

  const furyActive = character
    ? furyRemainingMs(character, moon.phase.key, Date.now()) > 0
    : false;

  const furyPotions = useMemo(
    () => detailInventory(state).filter((slot) => slot.item.potion === "rage"),
    [state],
  );

  if (!character || furyActive || furyPotions.length === 0) return null;

  const { item, quantity } = furyPotions[0];

  return (
    <FuryRingFrame
      as="button"
      type="button"
      contentAlign="start"
      className="block w-full border-0 bg-transparent p-0 font-[inherit] text-left transition-[filter] hover:brightness-110"
      fillClassName="w-full"
      onClick={() => {
        playClick();
        void consumeItem(item.id);
      }}
    >
      <div className="flex w-full items-stretch">
        <span className="flex w-8 shrink-0 items-center justify-center self-stretch border-r border-edge">
          <Flame aria-hidden strokeWidth={1.75} className="h-4 w-4 text-ember" />
        </span>
        <div className="min-w-0 flex-1 px-3 py-2">
          <p className="truncate text-[10px] uppercase tracking-[0.16em] text-ink">Poção de fúria</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-ember">
            Beber{quantity > 1 ? " · " + quantity : ""}
          </p>
        </div>
      </div>
    </FuryRingFrame>
  );
}
